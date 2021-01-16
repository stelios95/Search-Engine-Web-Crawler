const express = require("express");
const mongoose = require("mongoose");
mongoose.set('useCreateIndex', true);
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
    .connect(CRAWLER_CONSTANTS.DATABASE_STRING, {useNewUrlParser: true, useUnifiedTopology: true})
    console.log("Connected to Atlas DB for page contents!");
  } catch (error) {
    console.log("ERROR: " + error);
  }
}

connectToMongo()

//server listening
app.listen(PORT, () => {
  console.log("Server is up!");
});

async function fullCrawl() {
  try {
    let date = new Date();
    console.log(`FULL CRAWL STARTED ON: ${date}`);
    const seeds = await dataUtils.fetchAllSeeds();
    const seedChunkSize = seeds.length / CRAWLER_CONSTANTS.NUMBER_OF_THREADS
    let start = 0
    let end = seedChunkSize
    for (let i = 0; i < CRAWLER_CONSTANTS.NUMBER_OF_THREADS; i++){
      new Promise ((resolve, reject ) => {
        const worker = new Worker('./crawlingProcesses.js', { workerData: {
          data: seeds.slice(start, end),
          thread: i + 1,
          method: CRAWLER_CONSTANTS.FULL_SCAN
        } });
        worker.on('message', result => {
          worker.terminate()
			    resolve(result)
        });
        worker.on('error', reject);
        worker.on('exit', (code) => {
            reject(new Error(`Worker stopped with exit code ${code}`));
        });
      }).catch(err => console.log(err.message))

      start = end
      end = end + seedChunkSize < seeds.length ? end + seedChunkSize : seeds.length
    }
    seeds.length = 0
  } catch (err) {
    console.log(err)
  }
  
}

async function refreshContent() {
  try {
    console.log(`REFRESH STARTED ON ${new Date}`)
    const sitesToRefresh = await dataUtils.getFrequentlyChangedSites();
    //console.log(sitesToRefresh.length)
    const sitesToRefreshChunkSize = Math.floor(sitesToRefresh.length / CRAWLER_CONSTANTS.NUMBER_OF_THREADS)
    const remainder = sitesToRefresh.length % CRAWLER_CONSTANTS.NUMBER_OF_THREADS
    let start = 0
    let end = sitesToRefreshChunkSize
    for (let i = 1; i <= CRAWLER_CONSTANTS.NUMBER_OF_THREADS; i++){
      //console.log(`CHUNK: ${end}`)
      //console.log(`start : ${start}, end ${end}`)
      new Promise ((resolve, reject ) => {
        const worker = new Worker('./crawlingProcesses.js', { workerData: {
          data: sitesToRefresh.slice(start, end).map(site => JSON.parse(JSON.stringify(site))),
          thread: i ,
          method: CRAWLER_CONSTANTS.REFRESH_DATABASE
        } });
        worker.on('message', result => {
          worker.terminate()
			    resolve(result)
        });
        worker.on('error', reject);
        worker.on('exit', (code) => {
          if (code !== 0)
            reject(new Error(`Worker stopped with exit code ${code}`));
        });
      }).catch(err => console.log(err.message))
      start = end
      end = end + sitesToRefreshChunkSize
      if (i === CRAWLER_CONSTANTS.NUMBER_OF_THREADS - 1) end += remainder - 1
    }
    sitesToRefresh.length = 0
  } catch (err) {
    console.log(err)
  }
}

const jobs = {};
//================ FULL CRAWL ================================
jobs.fullCrawlJob = new CronJob(
  "0 0 */12 * * *",
  function () {
    fullCrawl();
  },
  null,
  true
);

//=============== REFRESH DATABASE ============================
jobs.refreshJob = new CronJob(
  "0 0 2 * * *",
  function () {
    refreshContent()
  },
  null,
  true
);

function changeCronInterval(job, newPeriod, task) {
  // task = 1 -> full crawl
  if (job) {
    job.stop();
  }
  if (task) {
    job = new CronJob(
      "0 0 " + newPeriod + " * * *",
      function () {
        fullCrawl()
      },
      null,
      true
    );
  } else {
    job = new CronJob(
      "0 0 " + newPeriod + " * * *",
      function () {
        refreshContent()
      },
      null,
      true
    );
  }
}

module.exports.changeCronInterval = changeCronInterval;
module.exports.jobs = jobs;
