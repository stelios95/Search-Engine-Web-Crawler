const axios = require('axios')
const cheerio = require('cheerio')
const textProcessUtils = require('./textProcessUtils')
const Site = require('../pageSchema')

async function crawlWithCheerio(pageJsonInfo){
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
      const site = getSiteDocument(content, pageJsonInfo, title)
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

function getSiteDocument(content, pageJson, title){
  let removedStopwords = textProcessUtils.removeStopWords(content)
  //console.log(removedStopwords)
  let withoutLargeWords = textProcessUtils.getRidOfBigWords(removedStopwords)
 //console.log(withoutLargeWords)
  let finalStemmedContent = textProcessUtils.getStemmedContent(withoutLargeWords)
  console.log(finalStemmedContent)
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
  })
  //console.log(page)
  return page
}

module.exports.crawlWithCheerio = crawlWithCheerio