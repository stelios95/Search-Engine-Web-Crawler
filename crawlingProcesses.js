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
            //console.log(browser)
            const page = await browser.newPage()
            await page.goto(site.loc, {waitUntil: 'load', timeout: 0})
            //await page.waitForSelector('.category', { timeout: 1000 });
            const title = await page.evaluate(() => {
              return document.querySelector('title').innerText
            })
            //console.log(title)
            //get all content
            const body = await page.evaluate(() => {
              return document.querySelector('html').innerText})
            if(body) {
              let removedStopwords = textProcessUtils.removeStopWords(body)
              //console.log(removedStopwords)
              let withoutLargeWords = textProcessUtils.getRidOfBigWords(removedStopwords)
              //console.log(withoutLargeWords)
              let finalStemmedContent = textProcessUtils.getStemmedContent(withoutLargeWords)
              site.content = finalStemmedContent
              await page.close()
              await browser.close()
            }
          })
        console.log(site.content)
      } else {
        let pageContent = await axios.get(site.loc)
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
          let removedStopwords = textProcessUtils.removeStopWords(content)
          //console.log(removedStopwords)
          let withoutLargeWords = textProcessUtils.getRidOfBigWords(removedStopwords)
          //console.log(withoutLargeWords)
          let finalStemmedContent = textProcessUtils.getStemmedContent(withoutLargeWords)
          site.content = finalStemmedContent
        }
        console.log('content' + site.content)
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
      //console.log(robots)
      let siteMapUrl = await siteMapUtils.getSiteMapUrl(robots)
      console.log(siteMapUrl)
      let siteMap = await siteMapUtils.getSiteMapXml(siteMapUrl)
      for(let i = 0; i < seed.numberOfChildren; i++){
        let shouldBeCrawled = await dataUtils.shouldBeCrawled(siteMap.urlset.url[i].loc)
        if(shouldBeCrawled){
          if(seed.method){
            //pup
            crawlingUtils.crawlWithPuppeteer(siteMap.urlset.url[i], seed.method)
          } else {
            //cheerio
            crawlingUtils.crawlWithCheerio(siteMap.urlset.url[i], seed.method)
          }
        }
      }
    }
  } catch (err) {
    console.log(err)
  }
}

module.exports.refreshDatabaseContent = refreshDatabaseContent
module.exports.runFullCrawlingProcess = runFullCrawlingProcess