/**
 * Program Name:  image-catalog.js
 * 
 * Author:        Charles McKnight
 * 
 * Description:
 * 
 * This NodeJS script generates an Excel spreadsheet that 
 * contains a listing of the products and image file names
 * in the Central Supply Catalog.
 * 
 * Dependencies:
 * 
 * Library        Purpose               Installation
 * --------------------------------------------------
 *  fs      Filesystem read/write         npm i fs
 *  path    OS-independent path mgt       (built-in)
 *  xlsx    JSON to Excel Conversion      npm i xlsx
 */
const fs = require('fs');
const path = require("path");
const XLSX = require('xlsx')

// collect the product file names
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

const products = inputFiles.flatMap(file => JSON.parse(fs.readFileSync(file)));

// construct the JSON list of the data to be used
let imageList = []
products.forEach(product => {
  imageList.push({sku: product.sku, type: product.type, subtype: product.subtype, name: product.name, image: product.image});

})

// generate the Excel spreadsheet

const workSheet = XLSX.utils.json_to_sheet(imageList);
const workBook = XLSX.utils.book_new();
XLSX.utils.book_append_sheet(workBook, workSheet, "Product Image Catalog");

// Generate buffer
XLSX.write(workBook, {bookType: 'xlsx', type: 'buffer'})

// Binary String
XLSX.write(workBook, {bookType: 'xlsx', type: 'binary'})

XLSX.writeFile(workBook, 'CSC-image-catalog.xlsx')
