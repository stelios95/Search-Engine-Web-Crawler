const mongoose = require("mongoose");
mongoose.set('useCreateIndex', true);
const dataUtils = require("./utils/dataFetchUtils");
const siteMapUtils = require("./utils/siteMapUtils");
const crawlingUtils = require("./utils/crawlingMethodsUtils");
const axios = require("axios");
const cheerio = require("cheerio");
const puppeteer = require("puppeteer");
const textProcessUtils = require("./utils/textProcessUtils");
const CRAWLER_CONSTANTS = require("./crawlerConstants")
const Site = require("./pageSchema");
const { workerData, parentPort } = require('worker_threads');

connectToMongo(workerData)

async function connectToMongo(workerData){
  try {
    await mongoose
    .connect(CRAWLER_CONSTANTS.DATABASE_STRING, {useNewUrlParser: true, useUnifiedTopology: true})
    if (workerData.method === CRAWLER_CONSTANTS.FULL_SCAN)
      await runFullCrawlingProcess(workerData.data, workerData.thread)
    else if (workerData.method === CRAWLER_CONSTANTS.REFRESH_DATABASE)  {
      await refreshDatabaseContent(workerData.data, workerData.thread)
    }
    mongoose.connection.close()
    parentPort.postMessage('END')
  } catch (error) {
    console.log("ERROR: " + error);
  }
}

async function refreshDatabaseContent(sitesToRefresh, thread) {
  try {
    const sitesRescanned = []
    //console.log(sitesToRefresh[0])
    for (const site of sitesToRefresh) {
      //console.log(site.loc);
      if (site.method) { 
        // console.log("puppeteer");
        const browser = await puppeteer.launch({
          headless: true,
          args: ["--no-sandbox", "--disable-setuid-sandbox", "--lang=en-GB"],
        });
        const page = await browser.newPage();
        await page.goto(site.loc, { waitUntil: "load", timeout: 0 });
        const body = await page.evaluate(() => {
          return document.querySelector("html").innerText;
        });
        await page.close();
        await browser.close();
        if (body) {
          let processedContent = textProcessUtils.getProcessedContent(body);
          site.content = processedContent;
          sitesRescanned.push(site)
        }
      } else {
        //console.log('SITE: ' + JSON.stringify(site))
        let pageContent = await axios
          .get(site.loc, {maxRedirects: 15})
          .catch((err) => console.log(err));
        if (pageContent.status === 403) continue;
        let content;
        const $ = cheerio.load(pageContent.data);
        $("body").each((i, el) => {
          const item = $(el).text();
          content = content + item;
        });
        if (content) {
          let processedContent = textProcessUtils.getProcessedContent(content);
          site.content = processedContent;
          sitesRescanned.push(site)
        }
      }
      if (sitesRescanned.length === CRAWLER_CONSTANTS.MASS_INSERT_RECORDS_SIZE){
        await massUpdate(sitesRescanned, thread)
        sitesRescanned.length = 0
      }
    }
    await massUpdate(sitesRescanned, thread)
    sitesRescanned.length = 0
  } catch (err) {
    console.log(err);
  }
}

async function massUpdate(scannedSites, thread){
  let sitesUpdate = scannedSites.map(site => ({
    updateOne: {
      filter: { _id: site._id },
      update: { $set: site },
    }
  }));
  await Site.collection.bulkWrite(sitesUpdate)
  console.log('BATCH REFRESHED FROM THREAD ' + thread + ': ' + sitesUpdate.length)
  if (sitesUpdate.length !== CRAWLER_CONSTANTS.MASS_INSERT_RECORDS_SIZE)
    console.log(`REFRESH PROCESS FROM THREAD ${thread} COMPLETED AT ${new Date()} and will now close`)
}

async function runFullCrawlingProcess(seeds, thread) {
  try {
    const sitesToInsert = []
    for (const seed of seeds) {
      let robots = await siteMapUtils.getRobots(seed.page);
      let siteMapUrl = await siteMapUtils.getSiteMapUrl(robots);
      let siteMap = await siteMapUtils.getSiteMapXml(siteMapUrl);
      if (!siteMap.urlset.url.some(loc => loc === seed.page)){
        siteMap.urlset.url.unshift({loc: seed.page})
      }
      let pagesCrawled = 0;
      let index = 0;
      while ( pagesCrawled < seed.numberOfChildren && siteMap.urlset.url[index]) {
        if ( siteMap.urlset.url[index]["news:news"] && 
           (!textProcessUtils.isAscii(siteMap.urlset.url[index]["news:news"]["news:title"]) ||
           siteMap.urlset.url[index]["news:news"]["news:title"].length > CRAWLER_CONSTANTS.TITLE_LIMIT)) {
            index++;
            continue;
        }
        let title = await crawlingUtils.getPageTitle(
          siteMap.urlset.url[index].loc
        );
        // console.log(title);
        if (
          !title ||
          !textProcessUtils.isAscii(title) ||
          title.length > CRAWLER_CONSTANTS.TITLE_LIMIT
        ) {
          index++;
          continue;
        }
        let shouldBeCrawled = !await dataUtils.isAlreadyCrawled(title)
        if (shouldBeCrawled) {
          if (seed.method) {
            const crawledPage = await crawlingUtils.crawlWithPuppeteer(
              siteMap.urlset.url[index],
              seed.method,
              title
            );
            if (crawledPage) {
              sitesToInsert.push(crawledPage)
              console.log(crawledPage.title + ` == ${thread}`)
            }
          } else {
            const crawledPage = await crawlingUtils.crawlWithCheerio(
              siteMap.urlset.url[index],
              seed.method,
              title
            );
            if (crawledPage) sitesToInsert.push(crawledPage)
            //console.log(crawledPage.title + ` == ${thread}`)
          }
          pagesCrawled++;
        }
        index++;
        if (sitesToInsert.length === CRAWLER_CONSTANTS.MASS_INSERT_RECORDS_SIZE){
          console.log(`BATCH FROM THREAD ${thread} :${sitesToInsert.length}`)
          // console.log('BATCH: ' + JSON.stringify(sitesToInsert))
          await Site.insertMany(sitesToInsert)
          sitesToInsert.length = 0
        }
          
      }
    }
    console.log(`REMAINING FROM THREAD ${workerData.thread} :${sitesToInsert.length}`)
    // console.log('REMAINING: ' + JSON.stringify(sitesToInsert))
    if (sitesToInsert.length) await Site.insertMany(sitesToInsert)
  } catch (err) {
    console.log(err);
  } finally {
    console.log(`CRAWLING PROCESS FROM THREAD ${workerData.thread} COMPLETED AT ${new Date()} and now will be closed <3 `);
  }
}

module.exports.refreshDatabaseContent = refreshDatabaseContent;
module.exports.runFullCrawlingProcess = runFullCrawlingProcess;
