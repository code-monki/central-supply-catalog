const Path = require("path");
const currentEnv = process.env.ELEVENTY_ENV;

module.exports = function (eleventyConfig) {
  eleventyConfig.addPassthroughCopy("src/js");
  eleventyConfig.addPassthroughCopy("src/css");
  eleventyConfig.addPassthroughCopy("src/data");
  eleventyConfig.addPassthroughCopy("src/img");

  eleventyConfig.addWatchTarget("./src/scss");

  eleventyConfig.addFilter("relative", function (url) {
    return Path.join(
      "./",
      this.ctx.page.url.split("/").reduce((a, b) => a + (b && "../")),
      url
    );
  });

  return {
    dir: {
      output: "build",
      input: "src",
      data: "_data",
      includes: "partials_layouts",
    },
  };
};
