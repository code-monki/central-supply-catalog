const { src, dest, series, parallel, watch } = require("gulp");

const cp = require("child_process");
const sass = require("gulp-sass");
const cssnano = require("gulp-cssnano");
const uglify = require("gulp-uglify");
const rename = require("gulp-rename");
const imagemin = require("gulp-imagemin");
const htmlmin = require("gulp-htmlmin");
const sitemap = require("gulp-sitemap");
const save = require("gulp-save");
const removeEmptyLines = require("gulp-remove-empty-lines");
const autoprefixer = require("gulp-autoprefixer");
const babel = require("gulp-babel");
const browserSync = require("browser-sync").create();
const glob = require("glob");
const fs = require("fs");
const cheerio = require("cheerio");
const del = require("del");

// determine whether the operating system is Windows or a Unix variant
const platform = process.platform;

// Use Eleventy to build the site in the 'build' folder
const render = () => {
  return cp.spawn("npx", ["eleventy", "--quiet"], { shell: true, stdio: "inherit" });
};

const render_prod = () => {
  let platformScript = platform === "win32" || platform === "win64" ? "win-prod" : "prod";
  return cp.spawn("npm", ["run", platformScript, "--quiet"], { shell: true, stdio: "inherit" });
};

// process HTML files (minify)
const processHTML = () => {
  return src("build/**/*.html")
    .pipe(htmlmin({ collapseWhitespace: true }))
    .pipe(dest("./docs"));
};

// create SEO sitemap
const siteMap = () => {
  console.log('Running siteMap')
  return src("./docs/**/*.html", { read: false })
    .pipe(save("before-sitemap"))
    .pipe(sitemap({ siteUrl: "https://cmcknight.github.io/central-supply-catalog/"}))
    .pipe(removeEmptyLines())
    .pipe(dest("./docs"))
    .pipe(save.restore("before-sitemap"));
};

// process SASS files (autoprefix for cross-browser compatibility, minify)
const processSASS = () => {
  return src("./src/scss/*.scss")
         .pipe(sass())
         .pipe(autoprefixer())
         .pipe(dest('./docs/css'))
         .pipe(rename({suffix: '.min'}))
         .pipe(cssnano())
         .pipe(dest("./docs/css"));
};

// process Javascript files (babel for cross-browser compatiblity, minify)
const processJavascript = () => {
  return src(["./src/js/**/*.js", "!./src/utilities/indexer.js"])
    .pipe(babel({ presets: ["@babel/env"] }))
    .pipe(uglify())
    .pipe(rename({ sufix: ".min" }))
    .pipe(dest("./docs/js"));
};

// optimize images (reduce image sizes)
const optimizeImages = () => {
  return src("./src/img/**/*")
    .pipe(
      imagemin([
        imagemin.gifsicle({ interlaced: true }),
        imagemin.mozjpeg({ quality: 50, progressive: true }),
        imagemin.optipng({ optimizationLevel: 5 }),
        imagemin.svgo({
          plugins: [{ removeViewBox: true }, { cleanupIDs: false }],
        }),
      ])
    )
    .pipe(dest("./docs/img"));
};

// build the site search index
const buildSiteIndex = async () => {
  await buildIndex();
};

// copy the search index
const copyIndexFile = () => {
  return src(["./src/data/**/*"]).pipe(dest("./docs/data"));
};

// Move the robots.txt files
const copyRobotsText = () => {
  return src(["./src/robots*.txt"]).pipe(dest("./docs"));
};

// Copy the files folder
const CopyFilesFolder = () => {
  return src(["./src/files/**/*"]).pipe(dest("./docs/files"));
};

// clean the dist folder
const cleanDist = () => {
  return del("./docs/**/*");
};

// clean the build folder
const cleanBuild = () => {
  return del("./build/**/*");
};

// watch for changes to files
const monitor = () => {
  browserSync.init({
    server: "docs",
    browser: "Google Chrome",
  });

  watch(["./docs/**/*"]);
};

// define Gulp Tasks

// build the dist folder contents for localhost
exports.default = series(
  cleanBuild,
  cleanDist,
  render,
  // buildSiteIndex,
  // copyIndexFile,
  processHTML,
  processSASS,
  processJavascript,
  optimizeImages,
  siteMap,
  copyRobotsText,
  CopyFilesFolder
);

// build the dist folder contents for localhost
exports.production = series(
  cleanBuild,
  cleanDist,
  render_prod,
  processHTML,
  processSASS,
  processJavascript,
  optimizeImages,
  siteMap,
  // buildSiteIndex,
  // copyIndexFile,
  copyRobotsText,
  CopyFilesFolder
);

// Monitor the site in the dist folder
exports.monitor = monitor;

// clear the contents of the build folder
exports.clean_build = cleanBuild;

// clear the contents of the dist folder
exports.clean_dist = cleanDist;

// clear the contents of the build and dist folders
exports.clean_all = parallel(cleanBuild, cleanDist);

// Build the site index from the HTML files
const buildIndex = () => {
  const jsonDocs = [];
  const EXCLUDES = [
    "**/node_modules/**",
    "**/categories/**",
    "**/tags/**",
    "**/docs/**",
    "**/articles/**",
    "**/authors/**",
  ];
  const OUTPUT_DIR = "src/data";
  const INCLUDE_PATTERN = "dist/**/*.html";

  const myList = glob.sync(INCLUDE_PATTERN, { ignore: EXCLUDES });

  // convert HTML documents into JSON documents for array
  for (let i = 0; i < myList.length; i++) {
    let indexObj = {};

    // load the file into a string
    let htmldoc = fs.readFileSync(myList[i], "utf8");
    let $ = cheerio.load(htmldoc);

    // build the JSON document
    indexObj.id = i;
    indexObj.ref = myList[i].replace("dist", "");

    let title = $("title");
    indexObj.title = $("title").text();
    indexObj.text = " ";

    // Concatenate the text from the paragraph tags
    $("p").each(function (i, e) {
      let str = $(this).text().trim().replace(/\s+/g, " ");

      if (str.length > 0) {
        indexObj.text += str + " ";
      }
    });

    indexObj.text = indexObj.text.trim();

    // add the object to the array of JSON docs
    jsonDocs.push(indexObj);
  }

  // save the index to disk
  fs.writeFile(OUTPUT_DIR + "/searchIndex.idx", JSON.stringify(jsonDocs), function (err) {
    if (err) throw err;
    console.log("Index saved.");
  });
};
