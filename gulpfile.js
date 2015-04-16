var gulp = require('gulp'),
	notify = require('gulp-notify'),
	source = require('vinyl-source-stream'),
	sourcemaps = require('gulp-sourcemaps'),
	browserify = require('browserify'),
	exorcist = require('exorcist'),
	watchify = require('watchify'),
	babelify = require('babelify'),
	uglify = require('gulp-uglify'),
	streamify = require('gulp-streamify'),
	less = require('gulp-less'),
	connect = require('gulp-connect');

/*
TODO: We need to specify chokidar polling in watchify on Windows (waiting for https://github.com/substack/watchify/pull/139 to be merged)
*/

gulp.task('watch-js', function() {
	var bundler = browserify({
		debug: true, // Sourcemapping

		// watchify requires these options
		cache: {}, packageCache: {}, fullPaths: true
	})
	.require(require.resolve('./lib/main.js'), { entry: true })
	.transform(babelify.configure({
		optional: ["runtime"]
	}));

	// The actual bundling process
	var rebundle = function() {
		var start = Date.now();
		bundler.bundle()
			.on("error", notify.onError(function (error) {
				return error.message;
			}))
			.pipe(exorcist('dist/js/index.js.map')) // for Safari
			.pipe(source('main.js'))
			.pipe(gulp.dest('dist/js'))
			.pipe(connect.reload())
			.pipe(notify('Built in ' + (Date.now() - start) + 'ms'));
	};

	// Add watchify
	bundler = watchify(bundler);
	bundler.on('update', rebundle);

	return rebundle();
});

gulp.task('less', function() {
	return gulp.src('style/**/*.less')
		.pipe(sourcemaps.init())
		.pipe(less())
		.pipe(sourcemaps.write('.'))
		.pipe(gulp.dest('dist/css'));
});

gulp.task('watch-less', function() {
	gulp.watch(['style/**/*.less'], ['less']);
});

gulp.task('server', function() {
	connect.server({
		livereload: true
	});
});

gulp.task('prod', function() {
	var prodBundle = browserify({ debug: false })
		.require(require.resolve('./lib/main.js'), { entry: true })
		.transform(babelify.configure({
			optional: ["runtime"]
		}))
		.bundle()
		.pipe(source('main.js'))
		.pipe(streamify(uglify()))
		.pipe(gulp.dest('prod'))
		.pipe(notify('Built LESS in ' + (Date.now() - start) + 'ms'));
});

gulp.task('default', ['watch-js', 'less', 'watch-less', 'server']);