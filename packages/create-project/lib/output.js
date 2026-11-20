/**
 * External dependencies
 */
const { dirname, join } = require( 'path' );
const makeDir = require( 'make-dir' );
const { render } = require( 'mustache' );
const { writeFile } = require( 'fs' ).promises;

const writeOutputAsset = async ( inputFile, outputFile, view ) => {
	const outputFilePath = join( view.rootDirectory, 'assets', outputFile );
	await makeDir( dirname( outputFilePath ) );
	writeFile( outputFilePath, inputFile );
};

const writeOutputTemplate = async ( inputFile, outputFile, view ) => {
	// If the rendered template is empty, don't write it. This is how we can conditionally add template files.
	const renderedFile = render( inputFile, view );
	if ( renderedFile.trim().length ) {
		const outputFilePath = join( view.rootDirectory, outputFile );
		await makeDir( dirname( outputFilePath ) );
		writeFile(
			outputFilePath.replace( /\$slug/g, view.slug ),
			renderedFile
		);
	}
};

module.exports = {
	writeOutputAsset,
	writeOutputTemplate,
};
