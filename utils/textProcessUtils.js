const stopword = require('stopword')
const natural = require('natural')

//remove stopwords from content
function removeStopWords(content) {
  let removedSymbols = content
    .replace(/[#_<>/.,();=$:{}-]/g, ' ')
    .replace(/[!@%^&*+?`~©]/g, ' ')
    .replace(/\[|\]|"|'|\\/g, ' ')
    .replace(/\s{2,}/g, ' ')
  let removedStopWords = stopword.removeStopwords(removedSymbols.split(' ')).toString()
  let contentWithoutStopWords = removedStopWords
    .replace(/,/g, ' ')
    .replace(/(\b(\w{1,2})\b(\s|$))/g, '')
    .replace(/undefined|null|[0-9]/g, '')
  return contentWithoutStopWords    
}

//get rid of large words or numbers
function getRidOfBigWords(content){
  contentArray = content.split(' ')
  filteredArray = contentArray.filter(element => {
    return element.length < 15
  })
  //console.log(filteredArray)
  return filteredArray.join(' ')
}

//tokenize content and apply porter Stemmer
function getStemmedContent(content) {
  natural.PorterStemmer.attach()
  return content.tokenizeAndStem().toString().replace(/,/g, ' ')
}

function getProcessedContent(content){
  let removedStopwords = removeStopWords(content)
  let withoutLargeWords = getRidOfBigWords(removedStopwords)
  let finalStemmedContent = getStemmedContent(withoutLargeWords)
  return finalStemmedContent
}

module.exports.getProcessedContent = getProcessedContent

