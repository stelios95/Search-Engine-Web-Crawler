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
    
}


module.exports.getRobots = getRobots
module.exports.getSiteMapUrl = getSiteMapUrl