const Site = require("../pageSchema");
const axios = require("axios");
const BASE_URL = "https://crawler-admin-config-be.herokuapp.com";
// TODO : find a way to hide these credentials
const seedCredentials = {
  username: "stelios",
  password: "ntinos",
};
//get all the seeds
async function fetchAllSeeds() {
  try {
    const loginResponse = await axios.post(
      BASE_URL + "/seeds/login",
      seedCredentials
    );
    const allSeedsResponse = await axios.get(BASE_URL + "/seeds/fetchAll", {
      headers: {
        Authorization: `Bearer ${loginResponse.data.token}`,
      },
    });
    return allSeedsResponse.data;
  } catch (error) {
    console.error(error);
  }
}

//get only the sites that change frequently
async function getFrequentlyChangedSites() {
  return await Site.find({ changefreq: { $nin: [null , "never"] } });
}

async function getAlreadyCrawled(url) {
  const generalDomain = url.includes('www') ? url.split('www')[1] : url.split('//')[1]
  return await Site.find({ loc: {$regex: ".*" + generalDomain + ".*"} });
}

module.exports.fetchAllSeeds = fetchAllSeeds;
module.exports.getFrequentlyChangedSites = getFrequentlyChangedSites;
module.exports.getAlreadyCrawled = getAlreadyCrawled;
