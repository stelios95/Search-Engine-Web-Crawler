const express = require('express')
const mongoose = require('mongoose');
const dataUtils = require('./utils/dataFetchUtils')
const siteMapUtils = require('./utils/siteMapUtils')
const app = express()
const port = 4000;

const dbConnectionString = 'mongodb+srv://dbAdmin:yei6fahl@cluster0-xy1h1.mongodb.net/test?retryWrites=true&w=majority'

//connect to the page content db
mongoose
  .connect(dbConnectionString, { useNewUrlParser: true })
  .then(() => {
    //connected
    console.log('Connected to Atlas DB for page contents!');
  })
  .catch(error => {
    //db connection error
    console.log('ERROR: ' + error);
  });


//server listening
app.listen(port, () => {
    //listen for the queries of the client
    console.log('Server is up!')
})
//------ TEST METHODS ---------//
// FETCH ALL SEEDS
// allSeeds = dataUtils.fetchAllSeeds()
// allSeeds.then(result => {
//     console.log(result)
// }).catch(err => {
//     console.log(err)
// })

// SITEMAP UTILS TEST
siteMapUtils.getRobots('https://edition.cnn.com')
 .then(siteMapUtils.getSiteMapUrl)
 .then(siteMapUtils.getSiteMapXml)
 .catch(err => {
   console.log(err)
 })
  
 