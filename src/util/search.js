const miniSearch = require('minisearch')
const fs = require('fs');
const path = require("path");

const getProductFiles = function(dirPath, arrayOfFiles) {
  files = fs.readdirSync(dirPath);

  arrayOfFiles = arrayOfFiles || [];

  files.forEach(function(file) {
    let fn = path.join(dirPath, file);
    (fs.statSync(fn).isDirectory()) ?
      arrayOfFiles = getProductFiles(fn, arrayOfFiles) :
      arrayOfFiles.push(path.join(dirPath, "/", file));
  });

  return arrayOfFiles;
}

let arrayOfFiles;
const inputFiles = 
  getProductFiles(path.join('src', '_data'), arrayOfFiles)
      .filter(file => path.extname(file) === '.json');

// let idCounter = 0

let ms = new miniSearch({
  fields: [
    "sku",
    "name",
    "description",
    "cost",
],
  storeFields: ['sku', 'name', 'description', 'cost']
});

const products = inputFiles.flatMap((file) => JSON.parse(fs.readFileSync(file)));

// add id field
// let counter = 0;
products.forEach(product => product.id = products.indexOf(product))

// console.log(products);

// Add all of the products into the search map
ms.addAll(products);

fs.writeFileSync('src/_data/searchindex.idx', JSON.stringify(products))

// let jsonIdx = fs.readFileSync('src/_data/searchindex.idx', 'utf8');

// let ms2 = new miniSearch.loadJSON(jsonIdx, {
//   fields: [ 'sku', 'category', 'type', 'subtype', 'name', 'description', 'cost',
//             'mass', 'size', 'techLevel', 'qrebs', 'tags' ],
//   storeFields: ['sku', 'name', 'description', 'cost']
// });


// // console.log(`ms is ${(Array.isArray(ms)) ? "" : "not"})`)
// let searchTerm = 'portal'
// let options = (searchTerm.includes(' and ')) ? { combineWith: 'AND'} : {}
// let res = ms2.search(searchTerm, options);
// res.forEach(result => console.log(result));

// let testJSON = fs.readFileSync('src/_data_searchindex.idx', {encoding: 'utf8', flag: 'r'});

// let msTest = new miniSearch({
//   fields: [
//     'sku',
//     'category',
//     'type', 
//     'subtype', 
//     'name', 
//     'description',
//     'cost',
//     'mass',
//     'size',
//     'techLevel',
//     'qrebs',
//     'tags'
//   ],
//   storeFields: ['sku', 'name', 'description', 'cost']
// });
// msTest.loadJSON(testJson)