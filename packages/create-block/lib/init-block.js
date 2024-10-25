/**
 * External dependencies
 */
const { join } = require( 'path' );
const makeDir = require( 'make-dir' );
const { writeFile } = require( 'fs' ).promises;

/**
 * Internal dependencies
 */
const { info } = require( './log' );
const { writeOutputTemplate } = require( './output' );

async function initBlockJSON( {
	$schema,
	apiVersion,
	slug,
	namespace,
	title,
	version,
	description,
	category,
	attributes,
	supports,
	dashicon,
	textdomain,
	editorScript,
	editorStyle,
	style,
	viewStyle,
	render,
	viewScriptModule,
	viewScript,
	customBlockJSON,
	example,
	pathToBlockFiles,
} ) {
	info( '' );
	info( 'Creating a "block.json" file.' );

	const outputFile = join( pathToBlockFiles, 'block.json' );

	await makeDir( pathToBlockFiles );
	await writeFile(
		outputFile,
		JSON.stringify(
			Object.fromEntries(
				Object.entries( {
					$schema,
					apiVersion,
					name: namespace + '/' + slug,
					version,
					title,
					category,
					icon: dashicon,
					description,
					example,
					attributes,
					supports,
					textdomain,
					editorScript,
					editorStyle,
					style,
					viewStyle,
					render,
					viewScriptModule,
					viewScript,
					...customBlockJSON,
				} ).filter( ( [ , value ] ) => !! value )
			),
			null,
			'\t'
		)
	);
}

module.exports = async function ( outputTemplates, view ) {
	await Promise.all(
		Object.keys( outputTemplates ).map( async ( outputFile ) => {
			await writeOutputTemplate(
				outputTemplates[ outputFile ],
				outputFile,
				view,
				view.pathToBlockFiles
			);
		} )
	);
	await initBlockJSON( view );
};
