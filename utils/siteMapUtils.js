const axios = require('axios')
const parser = require('fast-xml-parser')
const he = require('he')

async function getRobots(url){
  //make request to get the robots.txt
  try {
      const robotsResponse = await axios
        .get(url + '/robots.txt')
      return robotsResponse.data
    } catch (error) {
      console.error(error);
    }
}

async function getSiteMapUrl(robots){
  //split robots file line by line 
  let sitemaps = new Array()
  let robotsLines = robots.match(/[^\r\n]+/g)
  robotsLines.forEach(element => {
    //if the line represents a sitemap
    if(element.includes('Sitemap:')){
      sitemaps.push(element.split(' ')[1])
    }
  });
  //select the final sitemap
  for(const sm of sitemaps){
    if(sm.includes('article') || sm.includes('news')){
      return sm
    }
  }
  return sitemaps[0]
}

async function getSiteMapXml(url){
  let xml
  try {
    xml = await axios
      .get(url)
  } catch (error) {
    console.error(error);
  }
  if(parser.validate(xml.data) === true) { 
    let jsonObj = parser.parse(xml.data);
    //check if it is sitemap index
    if(jsonObj.sitemapindex){
      return getSiteMapXml(jsonObj.sitemapindex.sitemap[0].loc)
    }
    //if it is not
    return jsonObj
  }
}

module.exports.getRobots = getRobots
module.exports.getSiteMapUrl = getSiteMapUrl
module.exports.getSiteMapXml = getSiteMapXml