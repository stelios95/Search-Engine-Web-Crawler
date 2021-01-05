const express = require('express')
const crons = require('./index')
const configRoute = express.Router()
const cors = require("cors")
const app = express()

app.use(cors())
configRoute.route('/changeInterval').post((req, res) => {
  try{
    crons.changeCronInterval(crons.jobs.fullCrawlJob, req.body.crawlFreq, 1)
    console.log(`New full scan frequency: Every ${req.body.crawlFreq} hours`)
    crons.changeCronInterval(crons.jobs.refreshJob, req.body.updateFreq, 0)
    console.log(`New refresh frequency: Every ${req.body.crawlFreq} hours`)
    res.status(200).send('OK')
  } catch(err){
    console.log('ERROR: '+ err)
    res.status(400).send(err)
  }
})

module.exports = configRoute