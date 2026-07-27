const fs = require('fs');
const path = require("path");

const asArray = (value) => (Array.isArray(value) ? value : [value]);

const searchIndexVersion = () => {
  const serviceWorker = fs.readFileSync('src/sw.js', 'utf8');
  const match = serviceWorker.match(/const\s+version\s*=\s*['"]?([^;'"]+)/);
  return match ? match[1].trim() : '1';
};

const productImagePath = (product) => {
  if (product.image) {
    if (!product.image.startsWith('/img/')) return product.image;

    const requestedPath = path.join('src', product.image);
    if (fs.existsSync(requestedPath)) return product.image;
  }

  const skuPath = `/img/products/${product.sku}.png`;
  if (fs.existsSync(path.join('src', skuPath))) return skuPath;

  return '';
};

const productsDir = path.join('src', '_data', 'products');
const products = fs
  .readdirSync(productsDir)
  .flatMap((category) => {
    const categoryDir = path.join(productsDir, category);
    return fs
      .readdirSync(categoryDir)
      .filter((file) => path.extname(file) === '.json')
      .flatMap((file) => asArray(JSON.parse(fs.readFileSync(path.join(categoryDir, file), 'utf8'))));
  })
  .filter((product) => product.name && !product.sku.match(/-00000$/g))
  .sort((a, b) => a.name.localeCompare(b.name))
  .map((product) => ({
    sku: product.sku,
    name: product.name,
    description: product.description || '',
    summary: product.description || '',
    cost: product.cost,
    image: productImagePath(product),
  }));

fs.writeFileSync(
  'src/_data/searchindex.json',
  JSON.stringify({
    version: searchIndexVersion(),
    documents: products,
  })
);

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
