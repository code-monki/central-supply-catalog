const { text } = require("cheerio/lib/api/manipulation");
const Path = require("path");
const fs = require('fs')
const mfrData = require('./src/_data/manufacturers.json')
 
const currentEnv = process.env.ELEVENTY_ENV;

module.exports = function (eleventyConfig) {
  eleventyConfig.addPassthroughCopy("src/js");
  eleventyConfig.addPassthroughCopy("src/css");
  // eleventyConfig.addPassthroughCopy("src/data");
  eleventyConfig.addPassthroughCopy("src/img");
  
  eleventyConfig.addWatchTarget("./src/scss");

  eleventyConfig.addFilter("relative", function (url) {
    return Path.join(
      "./",
      this.ctx.page.url.split("/").reduce((a, b) => a + (b && "../")),
      url
    );
  });

  eleventyConfig.addFilter('costLabel', (cost) => {
    let value = (cost > 999999) ? 
      `${cost / 1000000} MCr` : `${cost} Cr`
    return value;
  })


  eleventyConfig.addShortcode("getMfr", function(mfrId) {
    const mfr = mfrData.find(obj => obj.mfrId === mfrId)
    let res = 'N/A'
    if (mfr !== undefined) {
      res = `<a href="${mfr.url}" target="_blank">${mfr.name}</a>`
    }
    return res;
  })

  eleventyConfig.addFilter("setRootPath", (rootPath) => {
    console.log(`currentEnv: [${currentEnv}]`)
    console.log(`rootPath: [${rootPath}]`)
    let path = rootPath
    if (currentEnv === 'prod') {
      path = (rootPath === '/') ? './' : `../${rootPath}`
    }    console.log(`Returning path: [${path}]`)
    return path
  })


  eleventyConfig.addShortcode("getAccessory", function(products, sku) {
    let object = products.find(item => item.sku === sku)
    let text = `<p>No accessories available</p>`

    if (object !== undefined && object !== null) {
      console.log('Building html')
      let imgURL = `../img/products/${sku}.png`
      let pageURL = `../products/${sku}.html`
      let shortName = object.shortName
      text = `
                  <div class="accessory-item">
                    <a href="${pageURL}" class="black-text">
                    <img src="${imgURL}">
                    ${shortName}
                    </a>
                  </div>
                `
    }
    return text
  })

  return {
    pathPrefix: "/central-supply-catalog/",
    dir: {
      output: "build",
      input: "src",
      data: "_data",
      includes: "partials_layouts",
    }
  };
};

