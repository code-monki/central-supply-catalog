/**
 * attributions.js
 *
 * This application takes a file of products and creates a list of attributions.
 *
 * Usage:   node attributions.js <data directory>
 *
 *
 */

const FS = require('fs');
const PATH = require('path');
const PROCESS = require('process');
const publishers = require('../../progdata/publishers.json');

// retrieve data directory from command line
const dataDirectory = PROCESS.argv[2];

// console.log(dataDirectory);

// Build list of directories
const directoryList = FS.readdirSync(dataDirectory);

let attributions = [];

// Process data files in each directory
directoryList.forEach((category) => {
  let targetDir = PATH.join(dataDirectory, category);
  let files = FS.readdirSync(targetDir);

  // loop through files
  files.forEach((file) => {
    let prodFN = PATH.join(targetDir, file);
    let product = JSON.parse(FS.readFileSync(prodFN));

    // loop through the attributions
    let prodSrc = product.sources;
    if (prodSrc === null || prodSrc === undefined) {
      console.log(`File: ${prodFN}:  No sources`);
    } else {
      prodSrc.forEach((entry) => {
        if (!attributions.find((obj) => obj.publication === entry.publication)) {
          if (entry.publication) {
            entry.publisher = publishers.find((obj) => obj.name === entry.publisher);
            attributions.push(entry);
          }
        }
      });
    }
  });
});

console.log(`${attributions.length} entries.`);

FS.writeFileSync(
  'attributions.json',
  JSON.stringify(attributions.sort((a, b) => a.publication.localeCompare(b.publication)))
);
