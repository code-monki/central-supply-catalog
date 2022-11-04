import gulp from 'gulp';
import dartSass from 'sass';
import gulpSass from 'gulp-sass';
const sass = gulpSass(dartSass);
import path from 'path';
import cp from 'child_process';
import cssnano from 'gulp-cssnano';
import uglify from 'gulp-uglify';
import rename from 'gulp-rename';
import imagemin from 'gulp-imagemin';
import imageminJpegtran from 'imagemin-jpegtran';
import imageminPngquant from 'imagemin-pngquant';
import imageminSvgo from 'imagemin-svgo';
import htmlmin from 'gulp-htmlmin';
import sitemap from 'gulp-sitemap';
import save from 'gulp-save';
import removeEmptyLines from 'gulp-remove-empty-lines';
import autoprefixer from 'gulp-autoprefixer';
import babel from 'gulp-babel';
import browserSync from 'browser-sync';
import glob from 'glob';
import fs from 'fs';
import {deleteAsync} from 'del';
import miniSearch from 'minisearch';
// import { cbrt } from 'core-js/core/number';
// import { CLIENT_RENEG_LIMIT } from 'tls';

const paths = {
  styles: {
    src: 'src/scss/**/*.scss',
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

// create SEO sitemap
const siteMap = () => {
  console.log("Running siteMap");
  return (
    gulp.src("./dist/**/*.html", { read: false })
      .pipe(save("before-sitemap"))
      .pipe(removeEmptyLines())
      .pipe(gulp.dest("./dist"))
      .pipe(save.restore("before-sitemap"))
  );
};

// process SASS files (autoprefix for cross-browser compatibility, minify)
const processSASS = () => {
  return gulp.src("./src/scss/*.scss")
    .pipe(sass())
    .pipe(autoprefixer())
    .pipe(gulp.dest("./dist/css"))
    .pipe(rename({ suffix: ".min" }))
    .pipe(cssnano())
    .pipe(gulp.dest("./dist/css"));
  cb();
};

// process Javascript files (babel for cross-browser compatiblity, minify)
const processJavascript = () => {
  return gulp.src(["./src/js/**/*.js", "!./src/utilities/indexer.js"])
    .pipe(babel({ presets: ["@babel/env"] }))
    .pipe(uglify())
    .pipe(rename({ suffix: ".min" }))
    .pipe(gulp.dest("./dist/js"));
};

// optimize images (reduce image sizes)
const optimizeImages = () => {
  return gulp.src("./src/img/**/*")
    .pipe(
      imagemin([
        // imageminGifsicle({ interlaced: true }),
        imageminJpegtran({ quality: 50, progressive: true }),
        imageminPngquant({ optimizationLevel: 5 }),
        imageminSvgo ({
          plugins: [
            {
            name: "removeViewBox",
            active: true
            },
            {
              name: 'cleanupIDs',
              active: false
            }
          ]
        })
      ])
    )
    .pipe(gulp.dest("./dist/img"));
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
const build = gulp.series(
  cleanProd,
  render_prod,
  buildSiteIndex,
  processHTML,
  processSASS,
  processJavascript,
  optimizeImages,
  siteMap,
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
