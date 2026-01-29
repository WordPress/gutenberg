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
	plugin,
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
	folderName,
	editorScript,
	editorStyle,
	style,
	viewStyle,
	render,
	viewScriptModule,
	viewScript,
	customBlockJSON,
	example,
	rootDirectory,
} ) {
	info( '' );
	info( 'Creating a "block.json" file.' );

	const blockFolderName = plugin
		? join( rootDirectory, folderName )
		: rootDirectory;
	await makeDir( blockFolderName );

	await writeFile(
		join( blockFolderName, 'block.json' ),
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
				join(
					view.plugin ? view.folderName : '',
					outputFile.replace( /\$slug/g, view.slug )
				),
				view
			);
		} )
	);
	await initBlockJSON( view );
};
