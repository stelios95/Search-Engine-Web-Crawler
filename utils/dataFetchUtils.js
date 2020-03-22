const axios = require('axios')
const BASE_URL = 'https://crawler-admin-config-be.herokuapp.com'
const seedCredentials = {
    username: 'stelios',
    password: 'ntinos'
}

async function fetchAllSeeds() {
    try {
      const loginResponse = await axios
        .post(BASE_URL + '/seeds/login', seedCredentials)
      //console.log(loginResponse.data.token)
       const allSeedsResponse = await axios
        .get(BASE_URL + '/seeds/fetchAll',
            {
                headers: {
                Authorization: `Bearer ${loginResponse.data.token}`
            }
        })
        return allSeedsResponse.data
    } catch (error) {
      console.error(error);
    }
  }

  module.exports.fetchAllSeeds = fetchAllSeeds;