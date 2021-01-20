let dist_folder = 'dist';
let src_folder = 'src';
let domain_name = 'playground1.loc';
let fs = require('fs');

let path = {
	build:{
		html: dist_folder + '/',
		css: dist_folder + '/css/',
		js: dist_folder + '/js/',
		images: dist_folder + '/images/',
		fonts: dist_folder + '/fonts/',
	},
	src:{
		html: [ src_folder + '/*.html' ],
		css: src_folder + '/scss/style.scss',
		js: src_folder + '/js/app.js',
		images: src_folder + '/images/**/*.{jpg,png,svg,gif,ico,webp}',
		fonts: src_folder + '/fonts/*.ttf',
	},
	watch:{
		html: src_folder + '/**/*.html',
		css: src_folder + '/scss/*.scss',
		js: src_folder + '/js/**/*.js',
		images: src_folder + '/images/*.{jpg,png,svg,gif,ico,webp}',
	},
	clean: './' + dist_folder + '/'
}

let { src, dest } = require('gulp'),
	gulp = require('gulp'),
	browsersync = require('browser-sync').create(),
	fileinclude = require('gulp-file-include'),
	del = require('del'),
	scss = require('gulp-sass'),
	autoprefixer = require('gulp-autoprefixer'),
	group_media = require('gulp-group-css-media-queries'),
	clean_css = require('gulp-clean-css'),
	//rename = require('gulp-rename'),
	uglify = require('gulp-uglify-es').default,
	imagemin = require('gulp-imagemin'),
	webp = require('gulp-webp'),
	webphtml = require('gulp-webp-html'),
	webpcss = require('gulp-webp-css'),
	ttf2woff = require('gulp-ttf2woff'),
	ttf2woff2 = require('gulp-ttf2woff2'),
	fonter = require('gulp-fonter');


function browserSync(params) {
	browsersync.init({
/*		server: {
			baseDir: './' + dist_folder + '/'
		},
		port: 3000,*/
		open: 'external',
		host: domain_name,
		proxy: 'http://' + domain_name + '/www/' + dist_folder,
		notify: false
	})
}

function html() {
	return src( path.src.html )
		.pipe( fileinclude() )
		.pipe( webphtml() )
		.pipe( dest( path.build.html ) )
		.pipe( browsersync.stream() )
}

function js() {
	return src( path.src.js )
		.pipe( fileinclude() )
		.pipe( uglify() )
		.pipe( dest( path.build.js ) )
		.pipe( browsersync.stream() )
}

function css() {
	fs.copyFileSync( 'node_modules/modern-css-reset/dist/reset.css', src_folder + '/scss/reset.css' );
	return src( path.src.css )
		.pipe(
			scss({
				outputStyle: 'expanded',
			})
		)
		.pipe( group_media() )
		.pipe( autoprefixer() )
		.pipe( webpcss() )
		.pipe( clean_css() )
		.pipe( dest( path.build.css ) )
		.pipe( browsersync.stream() );

}

function images() {
	return src( path.src.images )
		.pipe(
			webp({
				quality: 70
			})
		)
		.pipe( dest( path.build.images ) )
		.pipe( src( path.src.images ) )
		.pipe(
			imagemin({
				progressive: true,
				optimizationLevel: 3,
				interlaced: true,
				svgoPlugins:[
					{
						removeViewBox: false
					}
				]
			})
		)
		.pipe( dest( path.build.images ) )
		.pipe( browsersync.stream() )

}

function fonts(params) {
	src(path.src.fonts)
		.pipe( ttf2woff() )
		.pipe( dest( path.build.fonts ) );
	return src(path.src.fonts)
		.pipe( ttf2woff2() )
		.pipe( dest( path.build.fonts ) )
}

function watchFiles(params) {
	gulp.watch([path.watch.html], html);
	gulp.watch([path.watch.css], css);
	gulp.watch([path.watch.js], js);
	gulp.watch([path.watch.images], images);
}

function clean(params) {
	return del( path.clean );
}

function fonts2css(params) {
	let file_content = fs.readFileSync(src_folder + '/scss/fonts.scss');
	if (file_content == '') {
		fs.writeFile(src_folder + '/scss/fonts.scss', '', cb);
		return fs.readdir(path.build.fonts, function (err, items) {
			if (items) {
				let c_fontname;
				for (var i = 0; i < items.length; i++) {
					let fontname = items[i].split('.');
					fontname = fontname[0];
					if (c_fontname != fontname) {
						fs.appendFile(src_folder + '/scss/fonts.scss', '@include font("' + fontname + '", "' + fontname + '", "400", "normal");\r\n', cb);
					}
					c_fontname = fontname;
				}
			}
		})
	}
}

function cb() {

}

gulp.task('otf2ttf', function() {
	return src([ src_folder + '/fonts/*.otf' ])
		.pipe(
			fonter({
				formats: ['ttf']
			})
		)
		.pipe( dest( src_folder + '/fonts/' ) );
});

let build = gulp.series( clean, gulp.parallel( js, css, html, images, fonts ), fonts2css );
let watch = gulp.parallel( watchFiles, build, browserSync );

exports.fonts2css = fonts2css;
exports.fonts = fonts;
exports.images = images;
exports.js = js;
exports.css = css;
exports.html = html;
exports.build = build;
exports.watch = watch;
exports.default = watch;