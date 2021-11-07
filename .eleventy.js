const path = require("path");
const fs = require("fs");
const markdownIt = require("markdown-it");
const mfrData = require("./progdata/manufacturers.json");
const categoriesData = require("./progdata/categories.json");
const departmentsData = require("./progdata/departments.json");
const slugify = require("slugify");
const { config } = require("process");
const { parse } = require("path");



const basePath = "";
const buildDest = process.env.ELEVENTY_DEST;

module.exports = function (eleventyConfig) {
  const md = new markdownIt({ html: true });

  eleventyConfig.addPassthroughCopy("src/js");
  eleventyConfig.addPassthroughCopy("src/css");
  eleventyConfig.addPassthroughCopy("src/_data/*.idx");
  eleventyConfig.addPassthroughCopy("src/sw.js");
  eleventyConfig.addPassthroughCopy("src/img");
  eleventyConfig.addPassthroughCopy("src/audio");
  eleventyConfig.setQuietMode(true);
  eleventyConfig.addWatchTarget("./src/scss");

  //-------------------------------------------------------------
  // Use local 404 page
  //-------------------------------------------------------------
  eleventyConfig.setBrowserSyncConfig({
    callbacks: {
      ready: function (err, bs) {
        bs.addMiddleware("*", (req, res) => {
          const content_404 = fs.readFileSync("build/404.html");
          // Add 404 http status code in request header.
          res.writeHead(404, { "Content-Type": "text/html; charset=UTF-8" });
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
  eleventyConfig.addFilter("costLabel", (cost) => {
    let value = "";
    let unitLabel = "Cr";
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
  
  prodDirectories.forEach(category => {
    eleventyConfig.addCollection(category, (collectionApi) => {
      let files = fs.readdirSync(path.join(basedir, category)).filter(file => path.extname(file) === '.json');
      let products = files.flatMap(file => JSON.parse(fs.readFileSync(path.join(basedir, category, file))));
      products.sort((a, b) => (a.name.localeCompare(b.name)));
      return products;
    })
  });

  //-------------------------------------------------------------
  // Convert numeric tech level to alphabetic character
  //-------------------------------------------------------------
  eleventyConfig.addFilter("convertTL", (techLevel) => {
    const TL = "0123456789ABCDEFGHJKLMNPQRSTUVWXYZ";
    return TL[techLevel];
  });

  //-------------------------------------------------------------
  // Render the incoming content Markdown fragment as HTML
  //-------------------------------------------------------------
  eleventyConfig.addFilter("markdown", (content) => {
    let text = md.render(content);
    return text;
  });

  //-------------------------------------------------------------
  // create shortcode to extract summary
  //-------------------------------------------------------------
  eleventyConfig.addShortcode("summary", (article) => extractSummary(article));

  //-------------------------------------------------------------
  // Get the categories
  //-------------------------------------------------------------
  eleventyConfig.addShortcode("getCategories", function () {
    let text = "<div><ul>";
    categoriesData.forEach((item) => {
      text += `<li>${item.label}</li>`;
    });
    text += "</ul></div>";
    return text;
  });

  //-------------------------------------------------------------
  // Get the manufacturer name
  //-------------------------------------------------------------
  eleventyConfig.addShortcode("getMfr", function (mfrId) {
    const mfr = mfrData.find((obj) => obj.mfrId === mfrId);
    let res = "N/A";
    if (mfr !== undefined) {
      res = `<a href="${mfr.url}" target="_blank">${mfr.name}</a>`;
    }

    return res;
  });

  //-------------------------------------------------------------
  // Get Accessory
  //-------------------------------------------------------------
  eleventyConfig.addShortcode("getAccessory", function (sku) {
    // get the parent department
    let key = sku.slice(0, 7);

    // get the name of the data file
    // let dataSrc = departmentsData.find((item) => (item.id === key ? item.data : ""));
    let deptObj = departmentsData.find((dept) => (dept.id === key ? dept : null));

    // let product = null;
    let text = `<p>No accessories available</p>`;
    let prodFileName = path.join(__dirname, deptObj.datadir, `${sku}.json`);

    let product = JSON.parse(fs.readFileSync(prodFileName));

    if (product !== undefined && product !== null) {
      let imgURL =
        product.image === "" || product.image === null
          ? `${basePath}/img/products/no-image.png`
          : `${basePath}/img/products/${sku}.png`;
      let pageURL = `../products/${sku}/`;

      text = `
      <div class="row accessory-row">
        <div class="">
          <a href="${urlSafe(pageURL)}">
            <img src="${imgURL}" alt="${product.name}">
          </a>
        </div>

        <div>
          <a href="${urlSafe(pageURL)}">${product.name}</a>
        </div>

      </div>

      `;
    }

    return text;
  });

  //-------------------------------------------------------------
  // build stats table body
  //-------------------------------------------------------------
  eleventyConfig.addShortcode("buildStatsBody", (stats) => {
    let text = "  <tbody>";
    let rows = parseInt(stats.length / 2) + (stats.length % 2);

    for (let ctr = 0; ctr < rows; ctr++) {
      text += `
        <tr>
          <td><strong>${stats[ctr].label}:</strong> ${stats[ctr].value}</td>`;

      if (stats[ctr + rows] !== null && stats[ctr + rows] !== undefined) {
        text += `<td><strong>${stats[ctr + rows].label}:</strong> ${stats[ctr + rows].value}</td>`;
      } else {
        text += "<td></td>";
      }

      text += `
        </tr>`;
    }

    text += `
      </tbody>`;

    return text;
  });

  //-------------------------------------------------------------
  // Build Department cards
  //-------------------------------------------------------------
  eleventyConfig.addShortcode("buildDepartmentCards", () => {
    let text = "";
    departmentsData.forEach((dept) => {
      if (dept.id.substr(-3) === "000") {
        text += `<div class="dept-card">`;

        let pageLink = `${basePath}/departments/${urlSafe(dept.label)}`;
        let imgLink = `${basePath}/img/${dept.icon}`;

        text += `
          <a href="${pageLink}/">
          <img src="${imgLink}" alt="${dept.label}"><br>${dept.label}
        </a>
      </div>
      `;
      }
    });

    return text;
  });

  //-------------------------------------------------------------
  // Generate department dropdown list
  //-------------------------------------------------------------
  eleventyConfig.addShortcode("generateDeptList", () => {
    let text = '<ul>';

    categoriesData
      .sort((a,b) => a.label.localeCompare(b.label))
      .forEach(category => {
        if (category.departments.length === 0) {
          text += `<li><a href="/departments/${urlSafe(category.label)}">${category.label}</a></li>`
        } else {
          text += `<li>${category.label}<ul>`

          // gather the subdepartment labels
          let deptList = [];
          category.departments.forEach( id => {
            // get the department object
            let dept = departmentsData.find(obj => obj.id === id);
            if (dept !== null && dept !== undefined) {
              deptList.push(dept.label);
            }
          })

          // sort the labels alphabetically and insert
          // as an unordered list
          deptList
            .sort((a, b) => a.localeCompare(b))
            .forEach(dept => {
            text += `<li><a href="/departments/${urlSafe(dept)}">${dept}</a></li>`;
          })
          
          text += `</ul></li>`
        }

    });



    text += '</ul>';

    // console.log(text);
    return text;
  });

  return {
    dir: {
      input: "src",
      output: "build",
      data: "_data",
      includes: "partials_layouts",
    },
  };

};

//----------------------------- End of main config function -------------------------------

//-------------------------------------------------------------
// Strip out any special characters from the URL (for Windows)
//-------------------------------------------------------------
const urlSafe = (text) => {
  let txt = text
    .replace(/[\,\"\.\*\@\!\?\<\>\&\^\%\$\#\~\`]/g, "")
    .replace(/\s+/, "-")
    .toLowerCase();

  return txt;
};

//-------------------------------------------------------------
// Extract marked summary from text.
//-------------------------------------------------------------
const extractSummary = (text) => {
  let summary = null;

  // The start and end separators to try and match to extract the summary
  const separatorsList = [
    { start: "<!-- Summary Start -->", end: "<!-- Summary End -->" },
    { start: "<p>", end: "</p>" },
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
