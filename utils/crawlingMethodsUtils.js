const axios = require("axios");
const cheerio = require("cheerio");
const puppeteer = require("puppeteer");
const textProcessUtils = require("./textProcessUtils");
const Site = require("../pageSchema");

async function crawlWithCheerio(pageJsonInfo, method, pageTitle) {
  //console.log('cheerio')
  try {
    let pageContent = await axios
      .get(pageJsonInfo.loc)
      .catch((err) => console.log(err));
    if (pageContent.status !== 200) pageContent = "";
    let content;
    let title = pageTitle;
    const $ = cheerio.load(pageContent.data);
    $("body").each((i, el) => {
      const item = $(el).text();
      content = content + item;
    });
    if (content) {
      return getSiteDocument(content, pageJsonInfo, title, method);
    } else return null
  } catch (err) {
    console.log(err);
  }
}

async function crawlWithPuppeteer(pageJsonInfo, method, pageTitle) {
  let site = undefined
  await (async () => {
    //console.log('puppeteer')
    try {
      const browser = await puppeteer.launch({
        headless: true,
        args: ["--no-sandbox", "--disable-setuid-sandbox", "--lang=en-GB"],
      });
      const page = await browser.newPage();
      await page.goto(pageJsonInfo.loc, { waitUntil: "load", timeout: 0 });
      const title = pageTitle;
      const body = await page.evaluate(() => {
        return document.querySelector("html").innerText;
      });
      await page.close();
      await browser.close();
      if (body)  site = getSiteDocument(body, pageJsonInfo, title, method);
    } catch (err) {
      console.log(err);
    }
  })();
  return site
}

function getSiteDocument(content, pageJson, title, method) {
  let finalStemmedContent = textProcessUtils.getProcessedContent(content);
  let processedTitle = textProcessUtils.getProcessedContent(title);
  let lastModification;
  if (pageJson["news:news"]) {
    lastModification = pageJson["news:news"]["news:publication_date"];
  } else if (pageJson.lastmod) {
    lastModification = pageJson.lastmod;
  } else {
    lastModification = new Date();
  }
  return new Site({
    title: title,
    processedTitle: processedTitle,
    loc: pageJson.loc,
    content: finalStemmedContent,
    lastmod: lastModification,
    changefreq: pageJson.changefreq ? pageJson.changefreq : null,
    priority: pageJson.priority ? pageJson.priority : null,
    isNews: pageJson["news:news"] ? true : false,
    method: method,
  });
}

async function getPageTitle(url) {
  let title = "";
  try {
    let pageContent = await axios.get(url);
    if (pageContent.status !== 200) pageContent = "";
    if (pageContent) {
      const $ = cheerio.load(pageContent.data);
      title = $('head > title').text()
      // .split(' - ')[0];
      // title = title.split(' | ')[0]
    }
  } catch (err) {
    console.log(err.message);
  } finally {
    return title;
  }
}

module.exports.crawlWithCheerio = crawlWithCheerio;
module.exports.crawlWithPuppeteer = crawlWithPuppeteer;
module.exports.getPageTitle = getPageTitle;
