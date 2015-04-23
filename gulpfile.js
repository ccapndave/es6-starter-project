var gulp = require('gulp'),
    notify = require('gulp-notify'),
    source = require('vinyl-source-stream'),
    sourcemaps = require('gulp-sourcemaps'),
    browserify = require('browserify'),
    exorcist = require('exorcist'),
    watchify = require('watchify'),
    babelify = require('babelify'),
    babel = require('gulp-babel'),
    copy = require('gulp-copy'),
    uglify = require('gulp-uglify'),
    streamify = require('gulp-streamify'),
    sass = require('gulp-sass'),
    gls = require('gulp-live-server'),
	watch = require('gulp-watch'),
	_ = require('lodash');

var server;

var clientDir = "./client";
var clientEntry = "src/main.js";
var clientDest = "./build/client";
var clientBundleTarget = "bundle.js";

/** The array of things to copy over directly */
var clientAssetGlobs = [
	clientDir + "/**/*",
	"!" + clientDir + "/src",
	"!" + clientDir + "/src/**/*",
	"!" + clientDir + "/style",
	"!" + clientDir + "/style/**/*"
];

var serverDir = "./server";
var serverEntry = "app.js";
var serverDest = "./build/server";

function timeTask(stream, taskFn) {
	var start = Date.now();
	taskFn(stream)
		.pipe(notify('Built in ' + (Date.now() - start) + 'ms'));
}

function getBrowserifyBundler(useSourceMaps, useWatchify) {
	var params = useWatchify ? _.assign({ debug: useSourceMaps }, watchify.args) : { debug: useSourceMaps };
	var wrapper = useWatchify ? _.compose(watchify, browserify) : browserify;
	return wrapper(params).require(require.resolve(clientDir + "/" + clientEntry), { entry: true });
}

// Use a closure to create a singleton server instance
var getServer = function() {
	var server = gls(serverDest + "/" + serverEntry);
	return function() {
		return server;
	}
}();

/* Client tasks */

gulp.task('client:watchify', function() {
	var bundle = getBrowserifyBundler(true, true);

	// The bundling process
	var rebundle = function() {
		var start = Date.now();
		var stream = bundle
			.bundle()
			.on("error", notify.onError(function(error) {
				return error.message;
			}))
			.pipe(exorcist(clientDest + '/js/index.js.map')) // for Safari
			.pipe(source(clientBundleTarget))
			.pipe(gulp.dest(clientDest + '/js'))
			.pipe(notify('Built in ' + (Date.now() - start) + 'ms'));
	};

	bundle.on('update', rebundle);

	return rebundle();
});

gulp.task('client:sass', function() {
	return gulp.src([clientDir + '/style/**/*.scss', clientDir + '/style/**/*.sass'])
		.pipe(sourcemaps.init())
		.pipe(sass())
		.pipe(sourcemaps.write('.'))
		.pipe(gulp.dest(clientDest + "/css"));
});

gulp.task('client:sass:watch', function() {
	gulp.watch([clientDir + '/style/**/*.scss', clientDir + '/style/**/*.sass'], ['client:sass']);
});

gulp.task('client:copy-assets', function() {
	// Copy everything apart from the src and style folders into the client build folder
	gulp.src(clientAssetGlobs)
		.pipe(gulp.dest(clientDest));
});

gulp.task('client:copy-assets:watch', function() {
	gulp.watch(clientAssetGlobs, ['client:copy-assets']);
});

gulp.task('client:dev', ['client:watchify', 'client:sass', 'client:sass:watch', 'client:copy-assets', 'client:copy-assets:watch']);

/* Server tasks */

/**
 * Transpile all javascript files in the server source directory into the build folder
 */
gulp.task('server:babel', function(cb) {
	gulp.src([serverDir + "/**/*.js"])
		.pipe(sourcemaps.init())
		.pipe(babel({ optional: ["runtime"] }))
		.on("error", notify.onError(function(error) {
			return error.message;
		}))
		.pipe(sourcemaps.write('.'))
		.pipe(gulp.dest(serverDest))
		.on("end", cb);
});

gulp.task('server:run', ['server:babel'], function(cb) {
	getServer().start();
	cb();
});

gulp.task('server:watch', ['server:run'], function() {
	// Recompile and restart the server if any js file apart from anything in public changes
	gulp.watch([
		serverDir + "/**/*.js",
		"!" + serverDir + "/public/**"
	], ['server:run']);
});

gulp.task('server:dev', ['server:run', 'server:watch']);

/* Default task */

gulp.task('dev', ['client:dev', 'server:dev']);

/* Default task */

gulp.task('default', ['dev']);