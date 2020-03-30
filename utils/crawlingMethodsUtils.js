const axios = require('axios')
const cheerio = require('cheerio')
const puppeteer = require('puppeteer');
const textProcessUtils = require('./textProcessUtils')
const Site = require('../pageSchema')

async function crawlWithCheerio(pageJsonInfo, method){
  console.log('cheerio')
  try{
    let pageContent = await axios.get(pageJsonInfo.loc)
    //console.log(pageContent.data)
    let content
    let title
    const $ = cheerio.load(pageContent.data)
    title = $('title').text()
    $('body').each((i, el) => {
        const item = $(el).text()
        content = content + item
    })
    if(content){
      //console.log(content)
      const site = getSiteDocument(content, pageJsonInfo, title, method)
      site.save()
      .then((result) => {
          console.log('Document Saved ' + site.title)
      })
      .catch((err) => {
          console.log('An error occured: ' + err)
      })
    }
  } catch(err) {
    console.log(err)
  }
}

async function crawlWithPuppeteer(pageJsonInfo, method){
  (async () => {
    console.log('puppeteer')
    try {
      const browser = await puppeteer.launch({ 
            headless: true,
            args: ['--no-sandbox', '--disable-setuid-sandbox', '--lang=en-GB'],
          });
      //console.log(browser)
      const page = await browser.newPage()
      await page.goto(pageJsonInfo.loc, {waitUntil: 'load', timeout: 0})
      //await page.waitForSelector('.category', { timeout: 1000 });
      const title = await page.evaluate(() => {
        return document.querySelector('title').innerText
      })
      //console.log(title)
      //get all content
      const body = await page.evaluate(() => {
        return document.querySelector('html').innerText})
      if(body) {
        const site = getSiteDocument(body, pageJsonInfo, title, method)
        site.save()
        .then((result) => {
            console.log('Document Saved ' + site.title)
        })
        .catch((err) => {
            console.log('An error occured: ' + err)
        })
      }
      await page.close()
      await browser.close()
    } catch(err){
      console.log(err)
    }
  })()
}

function getSiteDocument(content, pageJson, title, method){
  let finalStemmedContent = textProcessUtils.getProcessedContent(content)
  let lastModification
  if(pageJson['news:news']){
    lastModification = pageJson['news:news']['news:publication_date']
  } else if(pageJson.lastmod){
    lastModification = pageJson.lastmod
  } else {
    lastModification = null
  }
  const page = new Site({
    title: title,
    loc: pageJson.loc,
    content: finalStemmedContent,
    lastmod: lastModification,
    changefreq: pageJson.changefreq ? pageJson.changefreq : null,
    priority: pageJson.priority ? pageJson.priority : null,
    isNews: pageJson['news:news'] ? true : false,
    method: method
  })
  return page
}

module.exports.crawlWithCheerio = crawlWithCheerio
module.exports.crawlWithPuppeteer = crawlWithPuppeteer