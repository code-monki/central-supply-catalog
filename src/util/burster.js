/**
 * burster.js
 * 
 * This application takes a file of products and splits it into individual product
 * files based on the SKU. The new files will have names reflecting the SKU and will
 * continue to be individual JSON objects.
 * 
 * Usage:   node burster.js <data directory>
 * 
 *
 */

const FS = require('fs');
const PATH = require('path');
const PROCESS = require('process');


// retrieve data directory from command line
const dataDirectory = process.argv[2];

// console.log(dataDirectory);

// Build list of directories

const directoryList = FS.readdirSync(dataDirectory);

// Process data files in each directory
directoryList.forEach(category => {
  let targetDir = PATH.join(dataDirectory, category);
  let dataFile = JSON.parse(FS.readFileSync(PATH.join(targetDir, 'data.json')));

  // loop through the array of objects and write each to its own file
  dataFile.forEach(product => {
    let fileName = PATH.join(targetDir, `${product.sku}.json`);
    FS.writeFileSync(fileName, JSON.stringify(product, null, '  '));
  })
  
})
