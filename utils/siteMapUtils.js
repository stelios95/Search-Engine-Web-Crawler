const axios = require('axios')

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
      if(sm.includes('article')){
        return sm
      }
    }
    return sitemaps[0]
}


module.exports.getRobots = getRobots
module.exports.getSiteMapUrl = getSiteMapUrl