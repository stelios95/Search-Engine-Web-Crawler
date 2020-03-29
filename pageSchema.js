const mongoose = require('mongoose')
const uniqueValidator = require('mongoose-unique-validator')
const Schema = mongoose.Schema

//defing the site document schema
const pageSchema = new Schema({
    title: {
        type: String,
        required: true,
        unique: true
    },
    loc: {
        type: String,
        unique: true,
        required: true
    },
    content: {
        type: String,
        required: true
    },
    method: {
        type: Number,
        required: true
    },
    lastmod: {
        type: Date
    },
    changefreq: {
        type: String
    },
    priority: {
        type: String
    },
    isNews: {
        type:Boolean
    }
})

pageSchema.plugin(uniqueValidator)
module.exports = mongoose.model('Site', pageSchema)