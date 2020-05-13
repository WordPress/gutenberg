/**
 * External dependencies
 */
const { writeFile } = require( 'fs' ).promises;
const { snakeCase } = require( 'lodash' );
const makeDir = require( 'make-dir' );
const { render } = require( 'mustache' );
const { dirname } = require( 'path' );

/**
 * Internal dependencies
 */
const initWPScripts = require( './init-wp-scripts' );
const { code, info, success } = require( './log' );
const { hasWPScriptsEnabled } = require( './templates' );

module.exports = async function(
	blockTemplate,
	{
		namespace,
		slug,
		title,
		description,
		dashicon,
		category,
		author,
		license,
		licenseURI,
		version,
	}
) {
	slug = slug.toLowerCase();
	namespace = namespace.toLowerCase();

	info( '' );
	info( `Creating a new WordPress block in "${ slug }" folder.` );

	const { outputTemplates } = blockTemplate;
	const view = {
		namespace,
		namespaceSnakeCase: snakeCase( namespace ),
		slug,
		slugSnakeCase: snakeCase( slug ),
		title,
		description,
		dashicon,
		category,
		version,
		author,
		license,
		licenseURI,
		textdomain: namespace,
	};
	await Promise.all(
		Object.keys( outputTemplates ).map( async ( outputFile ) => {
			// Output files can have names that depend on the slug provided.
			const outputFilePath = `${ slug }/${ outputFile.replace(
				/\$slug/g,
				slug
			) }`;
			await makeDir( dirname( outputFilePath ) );
			writeFile(
				outputFilePath,
				render( outputTemplates[ outputFile ], view )
			);
		} )
	);

	if ( hasWPScriptsEnabled( blockTemplate ) ) {
		await initWPScripts( view );
	}

	info( '' );
	success(
		`Done: block "${ title }" bootstrapped in the "${ slug }" folder.`
	);
	if ( hasWPScriptsEnabled( blockTemplate ) ) {
		info( '' );
		info( 'Inside that directory, you can run several commands:' );
		info( '' );
		code( '  $ npm start' );
		info( '    Starts the build for development.' );
		info( '' );
		code( '  $ npm run build' );
		info( '    Builds the code for production.' );
		info( '' );
		code( '  $ npm run format:js' );
		info( '    Formats JavaScript files.' );
		info( '' );
		code( '  $ npm run lint:css' );
		info( '    Lints CSS files.' );
		info( '' );
		code( '  $ npm run lint:js' );
		info( '    Lints JavaScript files.' );
		info( '' );
		code( '  $ npm run packages-update' );
		info( '    Updates WordPress packages to the latest version.' );
		info( '' );
		info( 'You can start by typing:' );
		info( '' );
		code( `  $ cd ${ slug }` );
		code( `  $ npm start` );
	}
	info( '' );
	info( 'Code is Poetry' );
};
