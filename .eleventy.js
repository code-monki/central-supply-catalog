const path = require('path');
const fs = require('fs');
const markdownIt = require('markdown-it');
const mfrData = require('./progdata/manufacturers.json');
const categoriesData = require('./progdata/categories.json');
const departmentsData = require('./progdata/departments.json');
const publishers = require('./progdata/publishers.json');
const slugify = require('slugify');
const { config } = require('process');
const { parse } = require('path');

const basePath = '';
const buildDest = process.env.ELEVENTY_DEST;

module.exports = function (eleventyConfig) {
  const md = new markdownIt({ html: true });

  eleventyConfig.addPassthroughCopy('src/js');
  eleventyConfig.addPassthroughCopy('src/css');
  eleventyConfig.addPassthroughCopy('src/_data/*.idx');
  eleventyConfig.addPassthroughCopy('src/sw.js');
  eleventyConfig.addPassthroughCopy('src/img');
  eleventyConfig.addPassthroughCopy('src/audio');
  eleventyConfig.setQuietMode(true);
  eleventyConfig.addWatchTarget('./src/scss');

  //-------------------------------------------------------------
  // Use local 404 page
  //-------------------------------------------------------------
  eleventyConfig.setBrowserSyncConfig({
    callbacks: {
      ready: function (err, bs) {
        bs.addMiddleware('*', (req, res) => {
          const content_404 = fs.readFileSync('build/404.html');
          // Add 404 http status code in request header.
          res.writeHead(404, { 'Content-Type': 'text/html; charset=UTF-8' });
          // Provides the 404 content without redirect.
          res.write(content_404);
          res.end();
        });
      },
    },
  });

  //-------------------------------------------------------------
  // Create the cost label with the appropriate units
  //-------------------------------------------------------------
  eleventyConfig.addFilter('costLabel', (cost) => {
    let value = '';
    let unitLabel = 'Cr';
    let modValue = cost;

    if (cost > 999999999999) {
      modValue = cost / 10 ** 12;
      unitLabel = `TCr`;
    } else if (cost > 999999999) {
      modValue = cost / 10 ** 9;
      unitLabel = `BCr`;
    } else if (cost > 999999) {
      modValue = cost / 10 ** 6;
      unitLabel = `MCr`;
    } else if (cost > 999) {
      modValue = cost / 10 ** 3;
      unitLabel = `KCr`;
    } else {
      unitLabel = `Cr`;
    }

    displayValue = modValue - Math.floor(modValue) !== 0 ? modValue.toFixed(3) : Math.trunc(modValue);
    return `${displayValue} ${unitLabel}`;
  });

  //-------------------------------------------------------------
  // Add custom product collections
  //-------------------------------------------------------------
  let basedir = path.join('src', '_data', 'products');

  // gather list of product directories
  let prodDirectories = fs.readdirSync(basedir);

  prodDirectories.forEach((category) => {
    eleventyConfig.addCollection(category, (collectionApi) => {
      let files = fs.readdirSync(path.join(basedir, category)).filter((file) => path.extname(file) === '.json');
      let products = files.flatMap((file) => JSON.parse(fs.readFileSync(path.join(basedir, category, file))));
      products.sort((a, b) => a.name.localeCompare(b.name));

      return products;
    });
  });

  //-------------------------------------------------------------
  // Add category rollup collections
  //-------------------------------------------------------------

  // collect rollups (categories with departments)
  let rollups = categoriesData.filter((category) => category.departments.length > 0);

  rollups.forEach((category) => {
    let categoryLabel = slugify(category.label, { lower: true, strict: true });

    // build the products array
    let products = [];

    category.departments.forEach((dept) => {
      let deptDataDir = departmentsData.find((obj) => obj.id === dept).datadir;
      let files = fs.readdirSync(deptDataDir).filter((file) => path.extname(file) === '.json');
      let prodArray = files
        .flatMap((file) => JSON.parse(fs.readFileSync(path.join(deptDataDir, file))), products)
        .filter((prod) => !prod.sku.match(/-00000$/g)); // filter out empty collections
      if (prodArray.length > 0) {
        products = products.concat(prodArray);
      }
    });
    eleventyConfig.addCollection(categoryLabel, (addCollectionApi) =>
      products.sort((a, b) => a.name.localeCompare(b.name))
    );
  });

  //-------------------------------------------------------------
  // Convert numeric tech level to alphabetic character
  //-------------------------------------------------------------
  eleventyConfig.addFilter('convertTL', (techLevel) => {
    const TL = '0123456789ABCDEFGHJKLMNPQRSTUVWXYZ';
    return TL[techLevel];
  });

  //-------------------------------------------------------------
  // Render the incoming content Markdown fragment as HTML
  //-------------------------------------------------------------
  eleventyConfig.addFilter('markdown', (content) => {
    let text = md.render(content);
    return text;
  });

  //-------------------------------------------------------------
  // create shortcode to extract summary
  //-------------------------------------------------------------
  eleventyConfig.addShortcode('summary', (article) => extractSummary(article));

  //-------------------------------------------------------------
  // Get the categories
  //-------------------------------------------------------------
  eleventyConfig.addShortcode('getCategories', function () {
    let text = '<div><ul>';
    categoriesData.forEach((item) => {
      text += `<li>${item.label}</li>`;
    });
    text += '</ul></div>';
    return text;
  });

  //-------------------------------------------------------------
  // Get the manufacturer name
  //-------------------------------------------------------------
  eleventyConfig.addShortcode('getMfr', function (mfrId) {
    const mfr = mfrData.find((obj) => obj.mfrId === mfrId);
    let res = 'N/A';
    if (mfr !== undefined) {
      res = `<a href="${mfr.url}" target="_blank">${mfr.name}</a>`;
    }

    return res;
  });

  //-------------------------------------------------------------
  // Get Accessory
  //-------------------------------------------------------------
  eleventyConfig.addShortcode('getAccessory', function (sku) {
    let product = getProduct(sku);
    // get the department
    // let key = sku.slice(0, 7);

    // get the name of the data file
    // let deptObj = departmentsData.find((dept) => (dept.id === key ? dept : null));

    let text = `<p>No accessories available</p>`;
    // let prodFileName = path.join(__dirname, deptObj.datadir, `${sku}.json`);

    // let product = JSON.parse(fs.readFileSync(prodFileName));

    if (product !== undefined && product !== null) {
      let imgURL =
        product.image === '' || product.image === null
          ? `${basePath}/img/products/no-image.png`
          : `${basePath}/img/products/${sku}.png`;

      text = `
      <div class="row accessory-row">
        <div class="">
          <a href="/products/${sku}">
            <img src="${imgURL}" alt="${product.name}">
          </a>
        </div>

        <div>
          <a href="/products/${sku}">${product.name}</a>
        </div>

      </div>

      `;
    }

    return text;
  });

  //-------------------------------------------------------------
  // build stats table body
  //-------------------------------------------------------------
  eleventyConfig.addShortcode('buildStatsBody', (stats) => {
    let text = '  <tbody>';
    let rows = parseInt(stats.length / 2) + (stats.length % 2);

    for (let ctr = 0; ctr < rows; ctr++) {
      text += `
        <tr>
          <td><strong>${stats[ctr].label}:</strong> ${stats[ctr].value}</td>`;

      if (stats[ctr + rows] !== null && stats[ctr + rows] !== undefined) {
        text += `<td><strong>${stats[ctr + rows].label}:</strong> ${stats[ctr + rows].value}</td>`;
      } else {
        text += '<td></td>';
      }

      text += `
        </tr>`;
    }

    text += `
      </tbody>`;

    return text;
  });

  //-------------------------------------------------------------
  // generate Publisher entry
  //-------------------------------------------------------------
  eleventyConfig.addShortcode('generatePublisher', (publisherName) => {
    let text = '';
    let pub = publishers.find((obj) => obj.name === publisherName);

    if (pub !== null && pub !== undefined) {
      if (pub.url !== null && pub.url !== undefined) {
        text += `<a href="${pub.url}" target="_blank">${pub.name}</a>`;
      } else {
        text += pub.name;
      }
    }
    return text;
  });

  //-------------------------------------------------------------
  // Generate department dropdown list
  //-------------------------------------------------------------
  eleventyConfig.addShortcode('generateDeptList', () => {
    let text = '<ul>';

    categoriesData
      .sort((a, b) => a.label.localeCompare(b.label))
      .forEach((category) => {
        if (category.departments.length === 0) {
          text += `<li><a href="/departments/${slugify(category.label, {
            lower: true,
            strict: true,
          })}" class="menu-item">${category.label}</a></li>`;
        } else {
          text += `<li><a href="/departments/${slugify(category.label, { lower: true, strict: true })}">${
            category.label
          }</a><ul>`;

          // gather the subdepartment labels
          let deptList = [];
          category.departments.forEach((id) => {
            // get the department object
            let dept = departmentsData.find((obj) => obj.id === id);
            if (dept !== null && dept !== undefined) {
              deptList.push(dept.label);
            }
          });

          // sort the labels alphabetically and insert
          // as an unordered list
          deptList
            .sort((a, b) => a.localeCompare(b))
            .forEach((dept) => {
              text += `<li><a href="/departments/${slugify(dept, {
                lower: true,
                strict: true,
              })}" class="submenu-item">${dept}</a></li>`;
            });

          text += `</ul></li>`;
        }
      });

    text += '</ul>';

    return text;
  });

  // generate product variant buttons
  eleventyConfig.addShortcode('generateVariants', (sku) => {
    let text = '';
    let product = getProduct(sku);
    product.variants.forEach((variant) => {
      let vp = getProduct(variant.sku);

      if (variant.sku === sku) {
        // mark as active page
        text += `<a class="active-variant">${variant.label}</a>`;
      } else {
        text += `<a href="/products/${variant.sku}">${variant.label}</a>`;
      }
    });

    return text;
  });

  return {
    dir: {
      input: 'src',
      output: 'build',
      data: '_data',
      includes: 'partials_layouts',
    },
  };
};

//----------------------------- End of main config function -------------------------------

//-------------------------------------------------------------
// Extract marked summary from text.
//-------------------------------------------------------------
const extractSummary = (text) => {
  let summary = null;

  // The start and end separators to try and match to extract the summary
  const separatorsList = [
    { start: '<!-- Summary Start -->', end: '<!-- Summary End -->' },
    { start: '<p>', end: '</p>' },
  ];

  separatorsList.some((separators) => {
    const startPosition = text.indexOf(separators.start);

    // This end position could use "lastIndexOf" to return all
    // the paragraphs rather than just the first paragraph when
    // matching is on "<p>" and "</p>".
    const endPosition = text.indexOf(separators.end);

    if (startPosition !== -1 && endPosition !== -1) {
      summary = text.substring(startPosition + separators.start.length, endPosition).trim();
      return true;
    }
  });

  return summary;
};

const getProduct = (sku) => {
  // get the department
  let key = sku.slice(0, 7);

  // get the name of the data file
  let deptObj = departmentsData.find((dept) => (dept.id === key ? dept : null));

  let prodFileName = path.join(__dirname, deptObj.datadir, `${sku}.json`);

  // get the product
  let product = null;
  try {
    product = JSON.parse(fs.readFileSync(prodFileName));
  } catch {
    console.error(`Product file ${prodFileName} does not exist.`);
  }

  return product;
};
