const { src, dest, series, parallel, watch } = require("gulp");
var sass = require("gulp-sass")(require("node-sass"));
const path = require("path");
const cp = require("child_process");
const cssnano = require("gulp-cssnano");
const uglify = require("gulp-uglify");
const rename = require("gulp-rename");
const imagemin = require("gulp-imagemin");
const imageminMozjpeg = require('imagemin-mozjpeg');
const htmlmin = require("gulp-htmlmin");
const sitemap = require("gulp-sitemap");
const save = require("gulp-save");
const removeEmptyLines = require("gulp-remove-empty-lines");
const autoprefixer = require("gulp-autoprefixer");
const babel = require("gulp-babel");
const browserSync = require("browser-sync").create();
const glob = require("glob");
const fs = require("fs");
const del = require("del");
const miniSearch = require("minisearch");
const readdirp = require("readdirp");

// determine whether the operating system is Windows or a Unix variant
const platform = process.platform;

// set output directory
let INDEX_OUTPUT_DIRECTORY = "";

// set build type

// Use Eleventy to build the site in the 'build' folder
const render = (cb) => {
  process.env.ELEVENTY_DEST = "./build";
  process.env.ELEVENTY_PREFIX = "";
  INDEX_OUTPUT_DIRECTORY = "./build/data";
  // return cp.spawn("npx", ["eleventy", "--quiet"], { shell: true, stdio: "inherit"});
  cb();
};

const render_prod = (cb) => {
  INDEX_OUTPUT_DIRECTORY = "./dist/data";
  let buildType = "prod";
  cp.execSync("npm run prod");
  cb();
  // return cp.spawn("npm", ["run", buildType, "--quiet"], {
  //   shell: true,
  //   stdio: "inherit",
  //   env: Object.assign({}, process.env, {
  //     ELEVENTY_DEST: "./docs",
  //     ELEVENTY_PREFIX: "/central-supply-catalog",
  //   })
  // });
  // cb()
};

// process HTML files (minify)
const processHTML = () => {
  return src("dist/**/*.html")
    .pipe(htmlmin({ collapseWhitespace: true }))
    .pipe(dest("./dist"));
};

// create SEO sitemap
const siteMap = () => {
  console.log("Running siteMap");
  return (
    src("./dist/**/*.html", { read: false })
      .pipe(save("before-sitemap"))
      // .pipe(sitemap({ siteUrl: "https://cmcknight.github.io/central-supply-catalog/" }))
      .pipe(removeEmptyLines())
      .pipe(dest("./dist"))
      .pipe(save.restore("before-sitemap"))
  );
};

// process SASS files (autoprefix for cross-browser compatibility, minify)
const processSASS = () => {
  return src("./src/scss/*.scss")
    .pipe(sass())
    .pipe(autoprefixer())
    .pipe(dest("./dist/css"))
    .pipe(rename({ suffix: ".min" }))
    .pipe(cssnano())
    .pipe(dest("./dist/css"));
  cb();
};

// process Javascript files (babel for cross-browser compatiblity, minify)
const processJavascript = () => {
  return src(["./src/js/**/*.js", "!./src/utilities/indexer.js"])
    .pipe(babel({ presets: ["@babel/env"] }))
    .pipe(uglify())
    .pipe(rename({ sufix: ".min" }))
    .pipe(dest("./dist/js"));
};

// optimize images (reduce image sizes)
const optimizeImages = () => {
  return src("./src/img/**/*")
    .pipe(
      imagemin([
        imagemin.gifsicle({ interlaced: true }),
        imageminMozjpeg({ quality: 50, progressive: true }),
        imagemin.optipng({ optimizationLevel: 5 }),
        imagemin.svgo({
          plugins: [{ removeViewBox: true }, { cleanupIDs: false }],
        }),
      ])
    )
    .pipe(dest("./dist/img"));
};

// build the site search index
const buildSiteIndex = async () => {
  buildIndex();
};

// copy the search index
const copyIndexFile = () => {
  return src(["./src/_data/**/*"]).pipe(dest("./dist/data"));
};

// Move the robots.txt files
const copyRobotsText = () => {
  return src(["./src/robots*.txt"]).pipe(dest("./dist"));
};

// Copy the files folder
const CopyFilesFolder = () => {
  return src(["./src/files/**/*"]).pipe(dest("./dist/files"));
};

// clean the dist folder
const cleanProd = () => {
  return del("./dist/**/*");
};

// clean the build folder
const cleanBuild = () => {
  return del("./build/**/*");
};

// watch for changes to files
const monitor = () => {
  browserSync.init({
    server: "dist",
    browser: "Google Chrome",
  });

  watch(["./dist/**/*"]);
};

// define Gulp Tasks

// build the dist folder contents for localhost
exports.default = series(
  cleanProd,
  render_prod,
  // buildSiteIndex,
  processHTML,
  processSASS,
  processJavascript,
  optimizeImages,
  siteMap,
  copyRobotsText,
  CopyFilesFolder
);

// Monitor the site in the dist folder
exports.monitor = monitor;

// clear the contents of the dist folder
exports.clean_prod = cleanProd;

// Build the site index from the HTML files
const buildIndex = () => {
  const inputFiles = JSON.parse(fs.readFileSync("progdata/departments.json"));

  console.log("In buildSiteIndex");

  let idCounter = 0;

  let ms = new miniSearch({
    fields: [
      "sku",
      "category",
      "type",
      "subtype",
      "name",
      "description",
      "cost",
      "mass",
      "size",
      "techLevel",
      "qrebs",
      "tags",
    ],
    storeFields: ["sku", "name", "description", "cost"],
  });

  inputFiles.forEach((department) => {
    // get the products from the file
    if (department.data !== null && department.data !== undefined) {
      let products = JSON.parse(fs.readFileSync(department.data));

      // build search index object and add to search index
      products.forEach((product) => {
        product.id = idCounter++;
        ms.add(product);
      });
    }
  });

  // create the output directory
  fs.mkdir(INDEX_OUTPUT_DIRECTORY, (err) => {
    if (err && err.code != "EEXIST") throw "up";

    // write the index
    fs.writeFile(path.join(INDEX_OUTPUT_DIRECTORY, "searchindex.idx"), JSON.stringify(ms), function (err) {
      if (err) console.error(err);
      console.log("Index saved.");
    });
  });
};
