const dataUtils = require('./utils/dataFetchUtils')
const siteMapUtils = require('./utils/siteMapUtils')
const crawlingUtils = require('./utils/crawlingMethodsUtils')

function refreshDatabaseContent(){
  // try{
  //   let sitesToRefresh = await getFrequentlyChangedSites
  // }
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
            crawlingUtils.crawlWithPuppeteer(siteMap.urlset.url[i])
          } else {
            //cheerio
            crawlingUtils.crawlWithCheerio(siteMap.urlset.url[i])
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