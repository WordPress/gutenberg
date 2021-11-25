/**
 * External dependencies
 */
const { promisify } = require( 'util' );
const fs = require( 'fs' );
const path = require( 'path' );
const babel = require( '@babel/core' );
const makeDir = require( 'make-dir' );
const sass = require( 'sass' );
const postcss = require( 'postcss' );
/**
 * Internal dependencies
 */
const getBabelConfig = require( './get-babel-config' );

/**
 * Path to packages directory.
 *
 * @type {string}
 */
const PACKAGES_DIR = path
	.resolve( __dirname, '../../packages' )
	.replace( /\\/g, '/' );

/**
 * Mapping of JavaScript environments to corresponding build output.
 *
 * @type {Object}
 */
const JS_ENVIRONMENTS = {
	main: 'build',
	module: 'build-module',
};

/**
 * Promisified fs.readFile.
 *
 * @type {Function}
 */
const readFile = promisify( fs.readFile );

/**
 * Promisified fs.writeFile.
 *
 * @type {Function}
 */
const writeFile = promisify( fs.writeFile );

/**
 * Promisified sass.render.
 *
 * @type {Function}
 */
const renderSass = promisify( sass.render );

/**
 * Get the package name for a specified file
 *
 * @param {string} file File name.
 *
 * @return {string} Package name.
 */
function getPackageName( file ) {
	return path.relative( PACKAGES_DIR, file ).split( path.sep )[ 0 ];
}

/**
 * Get Build Path for a specified file.
 *
 * @param {string} file        File to build.
 * @param {string} buildFolder Output folder.
 *
 * @return {string} Build path.
 */
function getBuildPath( file, buildFolder ) {
	const pkgName = getPackageName( file );
	const pkgSrcPath = path.resolve( PACKAGES_DIR, pkgName, 'src' );
	const pkgBuildPath = path.resolve( PACKAGES_DIR, pkgName, buildFolder );
	const relativeToSrcPath = path.relative( pkgSrcPath, file );
	return path.resolve( pkgBuildPath, relativeToSrcPath );
}

async function buildCSS( file ) {
	const outputFile = getBuildPath(
		file.replace( '.scss', '.css' ),
		'build-style'
	);
	const outputFileRTL = getBuildPath(
		file.replace( '.scss', '-rtl.css' ),
		'build-style'
	);

	const [ , contents ] = await Promise.all( [
		makeDir( path.dirname( outputFile ) ),
		readFile( file, 'utf8' ),
	] );

	const importLists = [
		'colors',
		'breakpoints',
		'variables',
		'mixins',
		'animations',
		'z-index',
	]
		// Editor styles should be excluded from the default CSS vars output.
		.concat(
			file.includes( 'common.scss' ) || ! file.includes( 'block-library' )
				? [ 'default-custom-properties' ]
				: []
		)
		.map( ( imported ) => `@import "${ imported }";` )
		.join( ' ' );

	const builtSass = await renderSass( {
		file,
		includePaths: [ path.join( PACKAGES_DIR, 'base-styles' ) ],
		// .
		data: ''.concat( '@use "sass:math";', importLists, contents ),
	} );

	const result = await postcss(
		require( '@wordpress/postcss-plugins-preset' )
	).process( builtSass.css, {
		from: 'src/app.css',
		to: 'dest/app.css',
	} );

	const resultRTL = await postcss( [ require( 'rtlcss' )() ] ).process(
		result.css,
		{
			from: 'src/app.css',
			to: 'dest/app.css',
		}
	);

	await Promise.all( [
		writeFile( outputFile, result.css ),
		writeFile( outputFileRTL, resultRTL.css ),
	] );
}

async function buildJS( file ) {
	for ( const [ environment, buildDir ] of Object.entries(
		JS_ENVIRONMENTS
	) ) {
		const destPath = getBuildPath(
			file.replace( /\.tsx?$/, '.js' ),
			buildDir
		);
		const babelOptions = getBabelConfig(
			environment,
			file.replace( PACKAGES_DIR, '@wordpress' )
		);

		const [ , transformed ] = await Promise.all( [
			makeDir( path.dirname( destPath ) ),
			babel.transformFileAsync( file, babelOptions ),
		] );

		await Promise.all( [
			writeFile( destPath + '.map', JSON.stringify( transformed.map ) ),
			writeFile(
				destPath,
				transformed.code +
					'\n//# sourceMappingURL=' +
					path.basename( destPath ) +
					'.map'
			),
		] );
	}
}

/**
 * Object of build tasks per file extension.
 *
 * @type {Object<string,Function>}
 */
const BUILD_TASK_BY_EXTENSION = {
	'.scss': buildCSS,
	'.js': buildJS,
	'.ts': buildJS,
	'.tsx': buildJS,
};

module.exports = async ( file, callback ) => {
	const extension = path.extname( file );
	const task = BUILD_TASK_BY_EXTENSION[ extension ];

	if ( ! task ) {
		callback( new Error( `No handler for extension: ${ extension }` ) );
	}

	try {
		await task( file );
		callback();
	} catch ( error ) {
		callback( error );
	}
};
