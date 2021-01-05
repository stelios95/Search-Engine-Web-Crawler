const os = require('os')
const DATABASE_STRING = "mongodb+srv://dbAdmin:yei6fahl@cluster0-xy1h1.mongodb.net/test?retryWrites=true&w=majority"
const MASS_INSERT_RECORDS_SIZE = 30
const TITLE_LIMIT = 150
const NUMBER_OF_THREADS = os.cpus().length
const FULL_SCAN = 'FULL_SCAN'
const REFRESH_DATABASE = 'REFRESH'

module.exports = {
  DATABASE_STRING: DATABASE_STRING,
  MASS_INSERT_RECORDS_SIZE: MASS_INSERT_RECORDS_SIZE,
  TITLE_LIMIT: TITLE_LIMIT,
  NUMBER_OF_THREADS: NUMBER_OF_THREADS,
  FULL_SCAN: FULL_SCAN,
  REFRESH_DATABASE: REFRESH_DATABASE
}