const express = require('express')
const crons = require('./index')
const configRoute = express.Router()
const cors = require("cors")
const app = express()res.status(200).send(result)

app.use(cors())
configRoute.route('/changeInterval').post((req, res) => {
  try{
    crons.changeCronInterval(crons.jobs.fullCrawlJob, req.body.crawlFreq, 1)
    crons.changeCronInterval(crons.jobs.refreshJob, req.body.updateFreq, 0)
    res.status(200).send('OK')
  } catch(err){
    console.log('ERROR: '+ err)
    res.status(400).send(err)
  }
})

module.exports = configRoute