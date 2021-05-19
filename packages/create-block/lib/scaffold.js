/**
 * External dependencies
 */
const { writeFile } = require( 'fs' ).promises;
const { snakeCase } = require( 'lodash' );
const makeDir = require( 'make-dir' );
const { render } = require( 'mustache' );
const { dirname, join } = require( 'path' );

/**
 * Internal dependencies
 */
const initBlockJSON = require( './init-block-json' );
const initPackageJSON = require( './init-package-json' );
const initWPScripts = require( './init-wp-scripts' );
const initWPEnv = require( './init-wp-env' );
const { code, info, success } = require( './log' );

module.exports = async (
	blockTemplate,
	{
		apiVersion,
		namespace,
		slug,
		title,
		description,
		dashicon,
		category,
		attributes,
		supports,
		author,
		license,
		licenseURI,
		version,
		wpScripts,
		wpEnv,
		npmDependencies,
		editorScript,
		editorStyle,
		style,
	}
) => {
	slug = slug.toLowerCase();
	namespace = namespace.toLowerCase();

	info( '' );
	info( `Creating a new WordPress block in "${ slug }" folder.` );

	const { outputTemplates, outputAssets } = blockTemplate;
	const view = {
		apiVersion,
		namespace,
		namespaceSnakeCase: snakeCase( namespace ),
		slug,
		slugSnakeCase: snakeCase( slug ),
		title,
		description,
		dashicon,
		category,
		attributes,
		supports,
		version,
		author,
		license,
		licenseURI,
		textdomain: slug,
		wpScripts,
		npmDependencies,
		editorScript,
		editorStyle,
		style,
	};
	await Promise.all(
		Object.keys( outputTemplates ).map( async ( outputFile ) => {
			// Output files can have names that depend on the slug provided.
			const outputFilePath = join(
				slug,
				outputFile.replace( /\$slug/g, slug )
			);
			await makeDir( dirname( outputFilePath ) );
			writeFile(
				outputFilePath,
				render( outputTemplates[ outputFile ], view )
			);
		} )
	);

	await Promise.all(
		Object.keys( outputAssets ).map( async ( outputFile ) => {
			const outputFilePath = join( slug, 'assets', outputFile );
			await makeDir( dirname( outputFilePath ) );
			writeFile( outputFilePath, outputAssets[ outputFile ] );
		} )
	);

	await initBlockJSON( view );
	await initPackageJSON( view );

	if ( wpScripts ) {
		await initWPScripts( view );
	}

	if ( wpEnv ) {
		await initWPEnv( view );
	}

	info( '' );
	success(
		`Done: block "${ title }" bootstrapped in the "${ slug }" folder.`
	);
	if ( wpScripts ) {
		info( '' );
		info( 'Inside that directory, you can run several commands:' );
		info( '' );
		code( '  $ npm start' );
		info( '    Starts the build for development.' );
		info( '' );
		code( '  $ npm run build' );
		info( '    Builds the code for production.' );
		info( '' );
		code( '  $ npm run format' );
		info( '    Formats files.' );
		info( '' );
		code( '  $ npm run lint:css' );
		info( '    Lints CSS files.' );
		info( '' );
		code( '  $ npm run lint:js' );
		info( '    Lints JavaScript files.' );
		info( '' );
		code( '  $ npm run packages-update' );
		info( '    Updates WordPress packages to the latest version.' );
	}
	info( '' );
	info( 'To enter the folder type:' );
	info( '' );
	code( `  $ cd ${ slug }` );
	if ( wpScripts ) {
		info( '' );
		info( 'You can start development with:' );
		info( '' );
		code( '  $ npm start' );
	}
	if ( wpEnv ) {
		info( '' );
		info( 'You can start WordPress with:' );
		info( '' );
		code( '  $ npx wp-env start' );
	}
	info( '' );
	info( 'Code is Poetry' );
};
