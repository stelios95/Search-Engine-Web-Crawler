const Site = require('../pageSchema')
const axios = require('axios')
const BASE_URL = 'https://crawler-admin-config-be.herokuapp.com'
const seedCredentials = {
    username: 'stelios',
    password: 'ntinos'
}
//get all the seeds
async function fetchAllSeeds() {
  try {
    const loginResponse = await axios
      .post(BASE_URL + '/seeds/login', seedCredentials)
      const allSeedsResponse = await axios
      .get(BASE_URL + '/seeds/fetchAll',
          {
            headers: {
            Authorization: `Bearer ${loginResponse.data.token}`
          }
      })
      return allSeedsResponse.data
  } catch (error) {
    console.error(error)
  }
}

//get only the sites that change frequently
async function getFrequentlyChangedSites(){
  return await Site.find({"changefreq": {$ne: null}})
}

// if the site is crawled and not frequently changing
// it shouldn't be crawled again
async function shouldBeCrawled(url){
  let result = await Site.find({"loc": url})
  return (result.length > 0) ? false : true
}

module.exports.fetchAllSeeds = fetchAllSeeds
module.exports.getFrequentlyChangedSites = getFrequentlyChangedSites
module.exports.shouldBeCrawled = shouldBeCrawled