const mongoose = require("mongoose");
const dataUtils = require("./utils/dataFetchUtils");
const siteMapUtils = require("./utils/siteMapUtils");
const crawlingUtils = require("./utils/crawlingMethodsUtils");
const axios = require("axios");
const cheerio = require("cheerio");
const puppeteer = require("puppeteer");
const textProcessUtils = require("./utils/textProcessUtils");
const CRAWLER_CONSTANTS = require("./crawlerConstants")
const Site = require("./pageSchema");
const {
  parentPort, workerData
} = require('worker_threads');

async function connectToMongo(workerData){
  try {
    await mongoose
    .connect(CRAWLER_CONSTANTS.DATABASE_STRING, { useNewUrlParser: true })
    // console.log(`Thread ${workerData.thread} connected!`);
    runFullCrawlingProcess(workerData.data, workerData.thread)
  } catch (error) {
    console.log("ERROR: " + error);
  }
}
connectToMongo(workerData)

async function refreshDatabaseContent() {
  try {
    console.log(`REFRESH STARTED ON ${new Date}`)
    let sitesToRefresh = await dataUtils.getFrequentlyChangedSites();
    const sitesRescanned = []
    console.log(sitesToRefresh.length)
    for (const site of sitesToRefresh) {
      console.log(site.loc);
      if (site.method) { 
        console.log("puppeteer");
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
        let pageContent = await axios
          .get(site.loc)
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
        massUpdate(sitesRescanned)
        sitesRescanned.length = 0
      }
    }
    massUpdate(sitesRescanned)
    sitesRescanned.length = 0
  } catch (err) {
    console.log(err);
  }
}

async function massUpdate(scannedSites){
  let sitesUpdate = scannedSites.map(site => ({
    updateOne: {
      filter: { _id: site._id },
      update: { $set: site },
    }
  }));
  await Site.collection.bulkWrite(sitesUpdate)
  console.log('BATCH REFRESHED: ' + sitesUpdate.length)
  if (sitesUpdate.length !== CRAWLER_CONSTANTS.MASS_INSERT_RECORDS_SIZE)
    console.log(`REFRESH PROCESS COMPLETED AT ${new Date()} `)
}

async function runFullCrawlingProcess(seeds, thread) {
  try {
    const sitesToInsert = []
    for (const seed of seeds) {
      let robots = await siteMapUtils.getRobots(seed.page);
      //console.log(robots)
      let siteMapUrl = await siteMapUtils.getSiteMapUrl(robots);
      //console.log(siteMapUrl)
      let siteMap = await siteMapUtils.getSiteMapXml(siteMapUrl);
      //console.log('sitemap : ' + siteMap)
      if (!siteMap.urlset.url.some(loc => loc === seed.page)){
        siteMap.urlset.url.unshift({loc: seed.page})
        //console.log(`page that was missing from sitemap: ${seed.page}`)
      }
      const alreadyCrawled = await dataUtils.getAlreadyCrawled(seed.page)
      let pagesCrawled = 0;
      let index = 0;
      while (
        pagesCrawled < seed.numberOfChildren &&
        siteMap.urlset.url[index]
      ) {
        if (
          siteMap.urlset.url[index]["news:news"] &&
          (!textProcessUtils.isAscii(
            siteMap.urlset.url[index]["news:news"]["news:title"]
          ) ||
            siteMap.urlset.url[index]["news:news"]["news:title"].length >
              CRAWLER_CONSTANTS.TITLE_LIMIT)
        ) {
          index++;
          continue;
        }
        let shouldBeCrawled = !alreadyCrawled.some(item => item.loc === siteMap.urlset.url[index].loc)
        if (shouldBeCrawled) {
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
            console.log(crawledPage.title + ` == ${thread}`)
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
    console.log(`CRAWLING PROCESS FROM THREAD ${workerData.thread} COMPLETED AT ${new Date()} `);
  }
}

module.exports.refreshDatabaseContent = refreshDatabaseContent;
module.exports.runFullCrawlingProcess = runFullCrawlingProcess;
