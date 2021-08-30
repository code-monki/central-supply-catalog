const miniSearch = require('minisearch')
const fs = require('fs')
const inputFiles = JSON.parse(fs.readFileSync("progdata/products/products-manifest.json"))

let idCounter = 0

let ms = new miniSearch({
  fields: [
    'sku',
    'category',
    'type', 
    'subtype', 
    'name', 
    'description',
    'cost',
    'mass',
    'size',
    'techLevel',
    'qrebs',
    'tags'
  ],
  storeFields: ['sku', 'name', 'description', 'cost']
})

inputFiles.forEach(file => {  
  // get the products from the file
  let products = JSON.parse(fs.readFileSync(`src/_data/${file}.json`))

  // build search index object and add to search index
  products.forEach(product => {
    product.id = idCounter++
    ms.add(product)
  })
})

let searchTerm = 'gas and torch cutting'
let options = (searchTerm.includes(' and ')) ? { combineWith: 'AND'} : {}

fs.writeFileSync('src/_data/searchindex.idx', JSON.stringify(ms))
console.log(ms.search(searchTerm, options ));
