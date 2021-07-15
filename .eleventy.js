const { text } = require("cheerio/lib/api/manipulation");
const Path = require("path");
const fs = require("fs");
const markdownIt = require("markdown-it");
const mfrData = require("./progdata/manufacturers.json");
const categoriesData = require("./progdata/categories.json");
const departmentsData = require("./progdata/departments.json");
const slugify = require('slugify')

const basePath = process.env.ELEVENTY_ENV === "prod" ? "/central-supply-catalog" : "";
const buildDest = process.env.ELEVENTY_ENV === "prod" ? "docs" : "build";

module.exports = function (eleventyConfig) {
  const md = new markdownIt({ html: true });

  eleventyConfig.addPassthroughCopy("src/js");
  eleventyConfig.addPassthroughCopy("src/css");
  // eleventyConfig.addPassthroughCopy("src/data");
  eleventyConfig.addPassthroughCopy("src/img");

  eleventyConfig.addWatchTarget("./src/scss");

  eleventyConfig.addFilter("costLabel", (cost) => {
    let value = cost > 999999 ? `${cost / 1000000} MCr` : `${cost} Cr`;
    return value;
  });

  eleventyConfig.addFilter("markdown", (content) => {
    let text = md.render(content);
    return text;
  });

  // create shortcode to extract summary
  eleventyConfig.addShortcode("summary", (article) => extractSummary(article));

  eleventyConfig.addShortcode("getCategories", function () {
    let text = "<div><ul>";
    categoriesData.forEach((item) => {
      text += `<li>${item.label}</li>`;
    });
    text += "</ul></div>";
    return text;
  });

  eleventyConfig.addShortcode("getMfr", function (mfrId) {
    const mfr = mfrData.find((obj) => obj.mfrId === mfrId);
    let res = "N/A";
    if (mfr !== undefined) {
      res = `<a href="${mfr.url}" target="_blank">${mfr.name}</a>`;
    }
    return res;
  });

  eleventyConfig.addShortcode("getAccessory", function (products, sku) {
    let object = products.find((item) => item.sku === sku);
    let text = `<p>No accessories available</p>`;

    if (object !== undefined && object !== null) {
      let imgURL = `../img/products/${sku}.png`;
      let pageURL = `../products/${sku}.html`;
      let shortName = object.shortName;
      text = `
                  <div class="accessory-item">
                    <a href="${urlSafe(pageURL)}" class="black-text">
                    <img src="${imgURL}" alt="${shortName}">
                    ${shortName}
                    </a>
                  </div>
                `;
    }
    return text;
  });

  // build category cards for home page
  eleventyConfig.addShortcode("buildCategoryCards", () => {
    let text = `<div class="category-cards container">
                <div class="row">`;
    categoriesData.forEach((category) => {
      text += buildCategoryCard(category);
    });

    text += "</div></div>";

    return text;
  });

  // Build Department cards
  eleventyConfig.addShortcode("buildDepartmentCards", () => {
    let text = "";
    departmentsData.forEach((dept) => {
      if (dept.id.substr(-3) === "000") {
        text += `
        <div class="card col s12 m5 offset-m1 push-m1">
          <div class="card-title">
            <a href="${basePath}/departments/${urlSafe(dept.label)}/">
              <h3>${dept.label}</h3>
            </a>
          </div>
          <div class="card-body">
            <a href="${basePath}/departments/${urlSafe(dept.label)}/">
              ${dept.description}
            </a>
          </div>
        </div>
      
      `;
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

const buildCategoryCard = (category) => {
  let text = `<div class="col s12 m6 card-container">
                <div class="card-panel black category-card">
                  <div class="category-card-content">
                    <a href="#${urlSafe(category.label)}-modal" class="modal-trigger btn big-button black red-text">
                      ${category.label}
                      <img src="img/${urlSafe(category.label)}.svg" alt="${category.label}">
                    </a>
                  </div>
                </div>
              </div>
              
              <div id="${urlSafe(category.label)}-modal" class="modal card-modal">
              <div class="modal-content">
        
                <a class="modal-close">
                  <i class="material-icons right">close</i>
                </a>
                
                <h6>${category.label}</h6>
                
                <div class="menu-lists">
                  <div>
                    <ul>`;

  category.departments.forEach((dept) => {
    let o = departmentsData.find((m) => m.id === dept);

    if (o !== undefined) {
      text += `                      <li><a href="${basePath}/departments/${urlSafe(o.label)
        .toLowerCase()
        .replace(" ", "-")}/">${o.label}</a></li>`;
    } else {
      console.log(`Undefined: ${dept}`);
    }
  });

  text += `         </ul>
                  </div>
                </div>
        
              </div>
            </div>`;

  return text;
};

const urlSafe = (text) => {
  let txt = text.replace(/[\,\"\.\*\@\!\?\<\>\&\^\%\$\#\~\`]/g, "")
                .replace(" ", "-")
                .toLowerCase()
  
  return txt;
};

function extractSummary(text) {
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
}
