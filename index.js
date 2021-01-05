const express = require("express");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const PORT = process.env.PORT || 4500;
const cors = require("cors");
const CronJob = require("cron").CronJob;
//const crawlingProcesses = require("./crawlingProcesses");
const dataUtils = require("./utils/dataFetchUtils");
const Site = require("./pageSchema");
const CRAWLER_CONSTANTS = require("./crawlerConstants")
const { Worker } = require("worker_threads")
const app = express();
const apiRoute = require("./routes");

app.use(cors());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use("/api", apiRoute);
//connect to the page content db
async function connectToMongo(){
  try {
    await mongoose
    .connect(CRAWLER_CONSTANTS.DATABASE_STRING, { useNewUrlParser: true })
    console.log("Connected to Atlas DB for page contents!");
    fullCrawl();
    //refreshContent()
  } catch (error) {
    console.log("ERROR: " + error);
  }
}

connectToMongo()

//server listening
app.listen(PORT, () => {
  //listen for the queries of the client
  console.log("Server is up!");
});

//full crawl should start immediately at start up

async function fullCrawl() {
  try {
    let date = new Date();
    console.log(`FULL CRAWL STARTED ON: ${date}`);
    const seeds = await dataUtils.fetchAllSeeds();
    const seedChunkSize = seeds.length / CRAWLER_CONSTANTS.NUMBER_OF_THREADS
    let start = 0
    let end = seedChunkSize
    for (let i = 0; i < CRAWLER_CONSTANTS.NUMBER_OF_THREADS; i++){
      const worker = new Worker('./crawlingProcesses.js', { workerData: {
        data: seeds.slice(start, end),
        thread: i + 1,
        method: CRAWLER_CONSTANTS.FULL_SCAN
      } });
      start = end
      end = end + seedChunkSize < seeds.length ? end + seedChunkSize : seeds.length
    }
  } catch (err) {
    console.log(err)
  }
  
}

async function refreshContent() {
  try {
    const sitesToRefresh = await dataUtils.getFrequentlyChangedSites();
    console.log(sitesToRefresh.length)
    const sitesToRefreshChunkSize = Math.floor(sitesToRefresh.length / CRAWLER_CONSTANTS.NUMBER_OF_THREADS)
    const remainder = sitesToRefresh.length % CRAWLER_CONSTANTS.NUMBER_OF_THREADS
    let start = 0
    let end = sitesToRefreshChunkSize
    for (let i = 1; i <= CRAWLER_CONSTANTS.NUMBER_OF_THREADS; i++){
      //console.log(`CHUNK: ${end}`)
      console.log(`start : ${start}, end ${end}`)
      const worker = new Worker('./crawlingProcesses.js', { workerData: {
        data: sitesToRefresh.slice(start, end).map(site => JSON.parse(JSON.stringify(site))),
        thread: i ,
        method: CRAWLER_CONSTANTS.REFRESH_DATABASE
      } });
      start = end
      end = end + sitesToRefreshChunkSize
      if (i === CRAWLER_CONSTANTS.NUMBER_OF_THREADS - 1) end += remainder - 1
    }
  } catch (err) {
    console.log(err)
  }
}


// ONLY FOR TEST!!
//refreshContent()

const jobs = {};
//================ FULL CRAWL ================================
jobs.fullCrawlJob = new CronJob(
  "0 0 */12 * * *",
  function () {
    fullCrawl();
  },
  null,
  true,
  "America/Los_Angeles"
);

//=============== REFRESH DATABASE ============================
jobs.refreshJob = new CronJob(
  "0 0 */6 * * *",
  function () {
    refreshContent()
  },
  null,
  true,
  "America/Los_Angeles"
);

function changeCronInterval(job, newPeriod, task) {
  // task = 1 -> full crawl
  if (job) {
    job.stop();
  }
  if (task) {
    job = new CronJob(
      "0 0 */" + newPeriod + " * * *",
      function () {
        let date = new Date();
        console.log(`FULL CRAWL STARTED ON: ${date.getMinutes()}`);
        crawlingProcesses.runFullCrawlingProcess();
      },
      null,
      true,
      "America/Los_Angeles"
    );
    job.start();
  } else {
    job = new CronJob(
      "0 0 */" + newPeriod + " * * *",
      function () {
        let date = new Date();
        console.log(`REFRESH STARTED ON: ${date.getMinutes()}`);
        crawlingProcesses.refreshDatabaseContent();
      },
      null,
      true,
      "America/Los_Angeles"
    );
    job.start();
  }
}

module.exports.changeCronInterval = changeCronInterval;
module.exports.jobs = jobs;
