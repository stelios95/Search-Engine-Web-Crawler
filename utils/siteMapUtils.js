const axios = require('axios')
const parser = require('fast-xml-parser')
const he = require('he')

async function getRobots(url){
  //make request to get the robots.txt
  try {
    console.log(url + '/robots.txt' )
      const robotsResponse = await axios
        .get(url + '/robots.txt')
      return robotsResponse.data
    } catch (error) {
      console.error(error.message);
    }
}

async function getSiteMapUrl(robots){
  //split robots file line by line 
  let sitemaps = new Array()
  let robotsLines = robots.match(/[^\r\n]+/g)
  robotsLines.forEach(element => {
    //if the line represents a sitemap
    if(element.includes('Sitemap:') || element.includes('SITEMAP:')){
      sitemaps.push(element.split(' ')[1])
    }
  });
  //select the final sitemap
  //select the first sitemap that includes articles or news
  for(const sm of sitemaps){
    if((sm.includes('article') || sm.includes('news') ) && sm.endsWith('.xml')){
      return sm
    }
  }
  //if no articles or news, just return the first valid sitemap ;)
  for (const sm of sitemaps){
    if (sm.endsWith('.xml')) return sm
  }
  return sitemaps[0]
}

async function getSiteMapXml(url){
  let xml
  try {
    xml = await axios
      .get(url)
    // console.log(xml.data)
    if(parser.validate(xml.data) === true) { 
      let jsonObj = parser.parse(xml.data);
      //check if it is sitemap index
      //console.log('VALIDATED XML')
      if(jsonObj.sitemapindex){
        //console.log('SITEMAP INDEX:' + JSON.stringify(jsonObj.sitemapindex))
        //if(Array.isArray(jsonObj.sitemapindex)) return getSiteMapXml(jsonObj.sitemapindex.sitemap[0].loc)
        return getSiteMapXml(jsonObj.sitemapindex.sitemap[0].loc)
      }
      //if it is not
      //console.log(JSON.stringify(jsonObj.urlset.url[0]['news:news']['news:publication_date']))

      return jsonObj
    } //else console.log(xml)
  } catch (error) {
    console.error(error);
  }
  
}

module.exports.getRobots = getRobots
module.exports.getSiteMapUrl = getSiteMapUrl
module.exports.getSiteMapXml = getSiteMapXml