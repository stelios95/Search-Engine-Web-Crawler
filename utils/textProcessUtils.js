const stopword = require('stopword')
const natural = require('natural')

//remove stopwords from content
exports.removeStopWords = function(content) {
    let removedSymbols = content
        .replace(/[#_<>/.,();=$:{}-]/g, ' ')
        .replace(/[!@%^&*+?`~]/g, ' ')
        .replace(/\[|\]|"|'|\\/g, ' ')
        .replace(/\s{2,}/g, ' ')
    let removedStopWords = stopword.removeStopwords(removedSymbols.split(' ')).toString()
    let contentWithoutStopWords = removedStopWords
        .replace(/,/g, ' ')
        .replace(/(\b(\w{1,3})\b(\s|$))/g, '')
        .replace(/undefined|null/g, '')
    return contentWithoutStopWords    
}

//tokenize content and apply porter Stemmer
exports.getStemmedContent = function (content) {
    natural.PorterStemmer.attach()
    return content.tokenizeAndStem().toString().replace(/,/g, ' ')
}