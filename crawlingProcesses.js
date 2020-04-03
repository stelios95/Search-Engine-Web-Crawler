const dataUtils = require('./utils/dataFetchUtils')
const siteMapUtils = require('./utils/siteMapUtils')
const crawlingUtils = require('./utils/crawlingMethodsUtils')
const axios = require('axios')
const cheerio = require('cheerio')
const puppeteer = require('puppeteer')
const textProcessUtils = require('./utils/textProcessUtils')

async function refreshDatabaseContent(){
  try{
    let sitesToRefresh = await dataUtils.getFrequentlyChangedSites()
    for(const site of sitesToRefresh){
      console.log(site)
      if(site.method){        
        (async () => {
          console.log('puppeteer')
            const browser = await puppeteer.launch({ 
                  headless: true,
                  args: ['--no-sandbox', '--disable-setuid-sandbox', '--lang=en-GB'],
                });
            const page = await browser.newPage()
            await page.goto(site.loc, {waitUntil: 'load', timeout: 0})
            const title = await page.evaluate(() => {
              return document.querySelector('title').innerText
            })
            const body = await page.evaluate(() => {
              return document.querySelector('html').innerText})
            if(body) {
              let processedContent = textProcessUtils.getProcessedContent(body)
              site.content = processedContent
              await page.close()
              await browser.close()
            }
          })
      } else {
        let pageContent = await axios.get(site.loc)
        let content
        let title
        const $ = cheerio.load(pageContent.data)
        title = $('title').text()
        $('body').each((i, el) => {
            const item = $(el).text()
            content = content + item
        })
        if(content){
          let processedContent = textProcessUtils.getProcessedContent(content)
          site.content = processedContent
        }
      }
      await site.save();
    }
  } catch (err){
    console.log(err)
  }
}

async function runFullCrawlingProcess(){
  try{
    let seeds = await dataUtils.fetchAllSeeds()
    for(const seed of seeds){
      let robots = await siteMapUtils.getRobots(seed.page)
      let siteMapUrl = await siteMapUtils.getSiteMapUrl(robots)
      console.log(siteMapUrl)
      let siteMap = await siteMapUtils.getSiteMapXml(siteMapUrl)
      let pagesCrawled = 0
      let index = 0
      while(pagesCrawled < seed.numberOfChildren){
        if(!textProcessUtils.isAscii(siteMap.urlset.url[index]['news:news']['news:title'])){
          index++
          continue
        }
        let shouldBeCrawled = await dataUtils.shouldBeCrawled(siteMap.urlset.url[index].loc)
        if(shouldBeCrawled){
          if(seed.method){
            crawlingUtils.crawlWithPuppeteer(siteMap.urlset.url[index], seed.method)
          } else {
            crawlingUtils.crawlWithCheerio(siteMap.urlset.url[index], seed.method)
          }
          pagesCrawled++
        }
        index++
      }
    }
  } catch (err) {
    console.log(err)
  }
}

module.exports.refreshDatabaseContent = refreshDatabaseContent
module.exports.runFullCrawlingProcess = runFullCrawlingProcess