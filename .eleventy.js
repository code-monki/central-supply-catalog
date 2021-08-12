const Path = require("path");
const fs = require("fs");
const markdownIt = require("markdown-it");
const mfrData = require("./progdata/manufacturers.json");
const categoriesData = require("./progdata/categories.json");
const departmentsData = require("./progdata/departments.json");
const slugify = require("slugify");

console.log(`build type: ${process.env.ELEVENTY_ENV}`)

const basePath = process.env.ELEVENTY_ENV === "prod" ? "/central-supply-catalog" : "";
const buildDest = process.env.ELEVENTY_ENV === "prod" ? "docs" : "build";

module.exports = function (eleventyConfig) {
  const md = new markdownIt({ html: true });

  eleventyConfig.addPassthroughCopy("src/js");
  eleventyConfig.addPassthroughCopy("src/css");
  // eleventyConfig.addPassthroughCopy("src/data");
  eleventyConfig.addPassthroughCopy("src/img");
  eleventyConfig.setQuietMode(true);
  eleventyConfig.addWatchTarget("./src/scss");

  //-------------------------------------------------------------
  // Create the cost label with the appropriate units
  //-------------------------------------------------------------
  eleventyConfig.addFilter("costLabel", (cost) => {
    let value = "";

    if (cost > 999999999999) {
      value = `${cost / 10 ** 12} TCr`;
    } else if (cost > 999999999) {
      value = `${cost / 10 ** 9} BCr`;
    } else if (cost > 999999) {
      value = `${cost / 10 ** 6} MCr`;
    } else if (cost > 999) {
      value = `${cost / 10 ** 3} KCr`;
    } else {
      value = `${cost} Cr`;
    }
    return value;
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
    let key = sku.slice(0, 3) + "-000";

    // get the name of the data file
    let dataSrc = departmentsData.find((item) => (item.id === key ? item.data : ""));

    let object = null;

    // read the data file
    if (dataSrc !== "") {
      let typeProducts = JSON.parse(fs.readFileSync(dataSrc.data));
      object = typeProducts.find((item) => item.sku === sku);
    }

    let text = `<p>No accessories available</p>`;

    if (object !== undefined && object !== null) {
      let imgURL =
        object.image === "" || object.image === null
          ? `${basePath}/img/products/no-image.png`
          : `${basePath}../src/img/products/${sku}.png`;
      let pageURL = `../products/${sku}/`;

      text = `
      <div class="row accessory-row">
        <div class="col s3 m2 l1 accessory-item-img">
          <a href="${urlSafe(pageURL)}">
            <img src="${imgURL}" alt="${object.name}" class="responsive-img">
          </a>
        </div>

        <div class="col s9 m10 l11">
          <a href="${urlSafe(pageURL)}">${object.name} - Test</a>
        </div>

      </div>
      <div class="divider"></div>

      `;
    }

    return text;
  });

  //-------------------------------------------------------------
  // build category cards for home page
  //-------------------------------------------------------------
  eleventyConfig.addShortcode("buildCategoryCards", () => {
    let text = `<div class="categories-container container">
                  <div class="row">`;
    categoriesData.forEach((category) => {
      text += buildCategoryCard(category);
    });

    text += `
      </div>
    </div>`;

    return text;
  });

  //-------------------------------------------------------------
  // Build Department cards
  //-------------------------------------------------------------
  eleventyConfig.addShortcode("buildDepartmentCards", () => {
    let text = "";
    console.log(`Using ${basePath} for links`);
    departmentsData.forEach((dept) => {
      if (dept.id.substr(-3) === "000") {
        text += `<div class="dept-btn col s6 m3 l3 center">`;
        
        let pageLink = `${basePath}/departments/${urlSafe(dept.label)}`
        let imgLink = `${basePath}/img/${dept.icon}`

        text += `
          <a href="${pageLink}/" class="red-text">
          <img src="${imgLink}" alt="${dept.label}"><br>${dept.label}
        </a>
      </div>
      `   
      }
    });

    return text;
  });

  return {
    pathPrefix: basePath,
    dir: {
      output: buildDest,
      input: "src",
      data: "_data",
      includes: "partials_layouts",
    },
  };
};

//-------------------------------------------------------------
// Construct one category card
//-------------------------------------------------------------
const buildCategoryCard = (category) => {
  let text = `<div class="cat-btn col s6 m4 l3 offset-l0 xl4">
                <a href="#${urlSafe(
                  category.label
                )}-modal" class="modal-trigger btn big-button black red-text flow-text">
                  <img src="img/${urlSafe(category.label)}.svg" alt="${category.label}"><br>${category.label}
                </a>
              </div>
              
              <div id="${urlSafe(category.label)}-modal" class="modal card-modal">
                <div class="modal-content">
                  <a class="modal-close"><i class="material-icons right">close</i></a>
                  
                  <h6>${category.label}</h6>
                  
                  <div class="menu-lists">
                    <div>
                      <ul>`;
  category.departments.forEach((dept) => {
    let o = departmentsData.find((m) => m.id === dept);

    if (o !== undefined) {
      text += `<li><a href="${basePath}/departments/${urlSafe(o.label).toLowerCase().replace(" ", "-")}/">${
        o.label
      }</a></li>`;
    } else {
      // FIXME
      // console.log(`Undefined department: ${dept}`)
    }
  });

  text += `</ul>
  </div>
  </div>
  
  </div>
  </div>`;

  return text;
};

//-------------------------------------------------------------
// Strip out any special characters from the URL
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
