const express = require('express')
const mongoose = require('mongoose');
const bodyParser = require('body-parser')
const PORT = process.env.PORT || 5000
const cors = require('cors')
const CronJob = require('cron').CronJob;
const crawlingProcesses = require('./crawlingProcesses')
const app = express()
const apiRoute = require("./routes")
const dbConnectionString = 'mongodb+srv://dbAdmin:yei6fahl@cluster0-xy1h1.mongodb.net/test?retryWrites=true&w=majority'

app.use(cors())
app.use(bodyParser.urlencoded({ extended: true }))
app.use(bodyParser.json())
app.use('/api', apiRoute)
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
app.listen(PORT, () => {
    //listen for the queries of the client
    console.log('Server is up!')
})

const jobs = {}
//================ FULL CRAWL ================================
jobs.fullCrawlJob = new CronJob('0 */4 * * * *', function() {
  let date = new Date()
  console.log(`FULL CRAWL STARTED ON: ${date.getMinutes()}`)
  crawlingProcesses.runFullCrawlingProcess()
}, null, true, 'America/Los_Angeles')


//=============== REFRESH DATABASE ============================
jobs.refreshJob = new CronJob('0 */2 * * * *', function() {
  let date = new Date()
  console.log(`REFRESH STARTED ON: ${date.getMinutes()}`)
  crawlingProcesses.refreshDatabaseContent()
}, null, true, 'America/Los_Angeles')


function changeCronInterval(job, newPeriod, task) { // task = 1 -> full crawl
  if (job) {
    job.stop()
  }
  if(task){
    job = new CronJob('*/' + newPeriod + ' * * * * *', function () {
      let date = new Date()
      console.log(`FULL CRAWL STARTED ON: ${date.getMinutes()}`)
      crawlingProcesses.runFullCrawlingProcess()
    }, null, true, 'America/Los_Angeles')
    job.start()
  } else {
    job = new CronJob('*/' + newPeriod + ' * * * * *', function () {
      let date = new Date()
      console.log(`REFRESH STARTED ON: ${date.getMinutes()}`)
      crawlingProcesses.refreshDatabaseContent()
    }, null, true, 'America/Los_Angeles')
    job.start()
  }     
}

module.exports.changeCronInterval = changeCronInterval
module.exports.jobs = jobs
