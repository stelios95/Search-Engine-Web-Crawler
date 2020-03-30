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
//================ FULL CRAWL ==============
// crawlingProcesses.runFullCrawlingProcess()

//=============== REFRESH CRAWL ============
//crawlingProcesses.refreshDatabaseContent()
