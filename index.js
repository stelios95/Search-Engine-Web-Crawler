const express = require('express')
const mongoose = require('mongoose');
const crawlingProcesses = require('./crawlingProcesses')
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

crawlingProcesses.runFullCrawlingProcess().then(()=>{
  console.log('Process Finished!!')
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
// siteMapUtils.getRobots('https://edition.cnn.com')
//  .then(siteMapUtils.getSiteMapUrl)
//  .then(siteMapUtils.getSiteMapXml)
//  .then(res => {
//   crawlingUtils.crawlWithCheerio(res.urlset.url[0])
//  })
//  .catch(err => {
//    console.log(err)
//  })

//puppeteer
// siteMapUtils.getRobots('https://edition.cnn.com')
//  .then(siteMapUtils.getSiteMapUrl)
//  .then(siteMapUtils.getSiteMapXml)
//  .then(res => {
//   crawlingUtils.crawlWithPuppeteer(res.urlset.url[0])
//  })
//  .catch(err => {
//    console.log(err)
//  })

// changing freq
// setTimeout(() => {
// res = dataUtils.getFrequentlyChangedSites()
// res.then(res => {
//   console.log(res)
// })}, 10000)
 
// // should be crawled
// setTimeout(() => {
//   res = dataUtils.shouldBeCrawled('someurl')
//   res.then(res => {
//     console.log(res)
//   })}, 10000)
   