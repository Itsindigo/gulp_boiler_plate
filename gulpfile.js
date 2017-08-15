// gulp
var gulp = require('gulp');

// plugins
var connect = require('gulp-connect');
var jshint = require('gulp-jshint');
var uglify = require('gulp-uglify');
var cleanCSS = require('gulp-clean-css');
var ngAnnotate = require('gulp-ng-annotate');
var clean = require('gulp-clean');
var concat = require('gulp-concat');
var rename = require('gulp-rename');
var sass = require('gulp-sass');
var inject = require('gulp-inject');
var autoprefixer = require('gulp-autoprefixer');
var sourcemaps = require('gulp-sourcemaps');
var history = require('connect-history-api-fallback');
var runSequence = require('run-sequence');


var jsSourceFiles = [
    ''
];

var staticSourceFiles = {
    images: '',
    sass: ''
};

var vendors = [
    '....node_modules...'
];


// tasks

//JS Linter
gulp.task('lint', function() {
    return gulp.src(jsSourceFiles)
        .pipe(jshint())
        .pipe(jshint.reporter('default'))
        .pipe(jshint.reporter('fail'));
});

//Wipes dist directory before starting a new build
gulp.task('clean', function() {
    return gulp.src('./dist/*')
        .pipe(clean({force: true}));
});

//Minifies CSS
gulp.task('clean-css', function() {
    return gulp.src('dist/static/stylesheets/main.css')
        .pipe(sourcemaps.init())
        .pipe(cleanCSS({compatibility: 'ie8'}))
        .pipe(rename('main.min.css'))
        .pipe(sourcemaps.write('maps'))
        .pipe(gulp.dest('dist'))
});

// Minifies application code and writes to dist directory
gulp.task('minify-js', function() {
    return gulp.src(jsSourceFiles)
        .pipe(sourcemaps.init())
        .pipe(ngAnnotate())
        .pipe(concat('main.js'))
        .pipe(gulp.dest('dist'))
        .pipe(uglify({mangle: false}))
        .pipe(rename('main.min.js'))
        .pipe(sourcemaps.write('maps'))
        .pipe(gulp.dest('dist'))
});

// Minified 3rd Party/Vendor code and writes to dist directory
gulp.task('minify-vendor-js', function() {
    return gulp.src(vendors)
        .pipe(sourcemaps.init())
        .pipe(ngAnnotate())
        .pipe(concat('vendor.js'))
        .pipe(gulp.dest('dist'))
        .pipe(uglify({mangle: false}))
        .pipe(rename('vendor.min.js'))
        .pipe(sourcemaps.write('maps'))
        .pipe(gulp.dest('dist'))
});

//Copies application templates to dist directory
gulp.task('copy-html-files', function () {
    return gulp.src(['./app/**/*.html', '!./app/index.html'])
        .pipe(gulp.dest('./dist/templates/'));
});

//Copies static images into dist directory
gulp.task('copy-images', function() {
    return gulp.src(staticSourceFiles.images)
        .pipe(gulp.dest('./dist/static/img/'));
});

//Copies static images into dist directory
gulp.task('copy-sass', function() {
    return gulp.src(staticSourceFiles.sass)
        .pipe(gulp.dest('./dist/static/stylesheets/sass/'));
});

// Compiles Sass to CSS
gulp.task('sass', function () {
    return gulp.src('./dist/static/stylesheets/sass/**/*.scss')
        .pipe(sourcemaps.init())
        .pipe(sass().on('error', sass.logError))
        .pipe(autoprefixer({
            browsers: ['last 3 versions'],
            cascade: false
        }))
        .pipe(sourcemaps.write())
        .pipe(gulp.dest('./dist/static/stylesheets/'));
});

//Inserts minfied scripts into our production version of index.html
gulp.task('live-index', function() {
    //TODO run this as a sequence, inject vendor.js before main.js
    //TODO figure out a way NOT to prepend /dist to the injected scripts
    var target = gulp.src('./production/index.html');

    return target
        .pipe(inject(gulp.src(['./dist/*.min.js', './dist/*.min.css'])), {read: false})
        .pipe(gulp.dest('dist/'));
});

// Just html or JS changes a 'quick'
// arrays run sequentially, contents of arrays run in parallel.
gulp.task('quick',
    ['lint', 'minify-js', 'copy-html-files', 'prebuilt-index']
);

// Copy across static assets from app to dist
gulp.task('copy',
    ['copy-images', 'copy-sass', 'copy-html-files']
);


// Copy SASS from app into dist, compile into a main.css, minify to main.min.css
// arrays run sequentially, contents of arrays run in parallel.
gulp.task('quick-css', function(done) {
    runSequence(
        ['lint', 'copy'],
        ['sass'],
        ['clean-css'],
        done
    )
});


// Start to Finish building of dist directory,
gulp.task('build', function (done) {
   runSequence(
       'clean',
       'quick-css',
       'minify-js',
       'minify-vendor-js',
       'prebuilt-index',
       done
   )
});