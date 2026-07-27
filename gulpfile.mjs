import gulp from 'gulp';
import path from 'path';
import cp from 'child_process';
import cleanCSS from 'gulp-clean-css';
import uglify from 'gulp-uglify';
import rename from 'gulp-rename';
import htmlmin from 'gulp-html-minifier-terser';
import autoprefixer from 'gulp-autoprefixer';
import babel from 'gulp-babel';
import fs from 'fs';
import {deleteAsync} from 'del';
import miniSearch from 'minisearch';
// import { cbrt } from 'core-js/core/number';
// import { CLIENT_RENEG_LIMIT } from 'tls';

const paths = {
  styles: {
    src: 'src/css/**/*.css',
    dest: 'dist/css'
  },
  scripts: {
    src: 'src/js/**.*.js',
    dest: 'dist/js'
  }
}

let INDEX_OUTPUT_DIRECTORY = "dist/_data";

// Use Eleventy to build the site in the 'build' folder
const render = (cb) => {
  process.env.ELEVENTY_DEST = "./build";
  process.env.ELEVENTY_PREFIX = "";
  INDEX_OUTPUT_DIRECTORY = "./build/data";
  // return cp.spawn("npx", ["eleventy", "--quiet"], { shell: true, stdio: "inherit"});
  cb();
};


const render_prod = (cb) => {
  INDEX_OUTPUT_DIRECTORY = "./dist/_data";
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
  return gulp.src("dist/**/*.html")
    .pipe(htmlmin({ collapseWhitespace: true }))
    .pipe(gulp.dest("./dist"));
};

// process CSS files (autoprefix for cross-browser compatibility, minify)
const processCSS = () => {
  return gulp.src("./src/css/*.css")
    .pipe(autoprefixer())
    .pipe(gulp.dest("./dist/css"))
    .pipe(rename({ suffix: ".min" }))
    .pipe(cleanCSS())
    .pipe(gulp.dest("./dist/css"));
};

// process Javascript files (babel for cross-browser compatiblity, minify)
const processJavascript = () => {
  return gulp.src(["./src/js/**/*.js", "!./src/utilities/indexer.js"])
    .pipe(babel({ presets: ["@babel/env"] }))
    .pipe(uglify())
    .pipe(rename({ suffix: ".min" }))
    .pipe(gulp.dest("./dist/js"));
};

// Copy images. Image compression should be handled outside the build pipeline
// to avoid native binary downloader dependencies in production builds.
const copyImages = () => {
  return gulp.src("./src/img/**/*").pipe(gulp.dest("./dist/img"));
};

// build the site search index
const buildSiteIndex = async () => {
  buildIndex();
};

// copy the search index
// const copyIndexFile = () => {
//   return src(["./src/_data/**/*"]).pipe(dest("./dist/data"));
// };

// Move the robots.txt files
const copyRobotsText = () => {
  return gulp.src(["./src/robots*.txt"]).pipe(gulp.dest("./dist"));
};

// Copy the files folder
const CopyFilesFolder = () => {
  if (!fs.existsSync("./src/files")) return Promise.resolve();
  return gulp.src(["./src/files/**/*"]).pipe(gulp.dest("./dist/files"));
};

// clean the dist folder
const cleanProd = () => {
  return deleteAsync("./dist/**/*");
};

// clean the build folder
const cleanBuild = () => {
  return deleteAsync("./build/**/*");
};

// define Gulp Tasks

// build the dist folder contents for localhost
const build = gulp.series(
  cleanProd,
  render_prod,
  buildSiteIndex,
  processHTML,
  processCSS,
  processJavascript,
  copyImages,
  copyRobotsText,
  CopyFilesFolder
);

export default build;

// Monitor the site in the dist folder
//export {monitor as monitor};

// clear the contents of the dist folder
export {cleanProd as cleanProd};


// Build the site index from the HTML files
const buildIndex = () => {
  let arrayOfFiles;
  const inputFiles = getProductFiles(path.join("src", "_data"), arrayOfFiles).filter(
    (file) => path.extname(file) === ".json"
  );

  console.log("In buildSiteIndex");

  // let idCounter = 0;

  let ms = new miniSearch({
    fields: ["sku", "name", "description", "cost"],
    storeFields: ["sku", "name", "description", "cost"],
  });

  const products = inputFiles.flatMap((file) => JSON.parse(fs.readFileSync(file)));

  // add id field
  products.forEach((product) => (product.id = products.indexOf(product)));

  ms.addAll(products);

  // create the output directory
  fs.mkdir(INDEX_OUTPUT_DIRECTORY, (err) => {
    if (err && err.code != "EEXIST") throw "up";

    // write the index
    fs.writeFile(path.join(INDEX_OUTPUT_DIRECTORY, "searchindex.idx"), JSON.stringify(products), function (err) {
      if (err) console.error(err);
      console.log("Index saved.");
    });
  });
};

export {buildSiteIndex as buildSiteIndex};


// helper function for building site index file
const getProductFiles = function (dirPath, arrayOfFiles) {
  let files = fs.readdirSync(dirPath);

  arrayOfFiles = arrayOfFiles || [];

  files.forEach(function (file) {
    let fn = path.join(dirPath, file);
    fs.statSync(fn).isDirectory()
      ? (arrayOfFiles = getProductFiles(fn, arrayOfFiles))
      : arrayOfFiles.push(path.join(dirPath, "/", file));
  });

  return arrayOfFiles;
};
