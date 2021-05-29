const currentEnv = process.env.ELEVENTY_ENV;

module.exports = function (eleventyConfig) {
  eleventyConfig.addPassthroughCopy('src/js');
  eleventyConfig.addPassthroughCopy('src/css');
  eleventyConfig.addPassthroughCopy('src/data');
  eleventyConfig.addPassthroughCopy('src/img');

  eleventyConfig.addWatchTarget('./src/scss');

  return {
    dir: {
      output: 'build',
      input: 'src',
      data: 'data',
      includes: 'partials_layouts',
    },
    templateFormats: ['njk', 'md', 'html', 'yml'],
    htmlTemplateEngine: "njk"
  };
};
