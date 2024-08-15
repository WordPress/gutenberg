/**
 * External dependencies
 */
const { dirname, join } = require( 'path' );
const makeDir = require( 'make-dir' );
const { render } = require( 'mustache' );
const { writeFile } = require( 'fs' ).promises;

const writeOutputAsset = async ( inputFile, outputFile, view ) => {
	const outputFilePath = join( view.slug, 'assets', outputFile );
	await makeDir( dirname( outputFilePath ) );
	writeFile( outputFilePath, inputFile );
};

const writeOutputTemplate = async ( inputFile, outputFile, view ) => {
	const outputFilePath = view.plugin
		? join( view.slug, outputFile.replace( /\$slug/g, view.slug ) )
		: outputFile;
	await makeDir( dirname( outputFilePath ) );
	// If the rendered template is empty, don't write it. This is how we can conditionally add template files.
	const renderedFile = render( inputFile, view );
	if ( renderedFile.trim().length ) {
		writeFile( outputFilePath, renderedFile );
	}
};

module.exports = {
	writeOutputAsset,
	writeOutputTemplate,
};
