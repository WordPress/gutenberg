const { dirname, join } = require( 'path' );
const { writeFile, mkdir } = require( 'fs' ).promises;
const { render } = require( 'mustache' );

const writeOutputAsset = async ( inputFile, outputFile, view ) => {
	const outputFilePath = join( view.rootDirectory, 'assets', outputFile );
	await mkdir( dirname( outputFilePath ), { recursive: true } );
	writeFile( outputFilePath, inputFile );
};

const writeOutputTemplate = async ( inputFile, outputFile, view ) => {
	// If the rendered template is empty, don't write it. This is how we can conditionally add template files.
	const renderedFile = render( inputFile, view );
	if ( renderedFile.trim().length ) {
		const outputFilePath = join( view.rootDirectory, outputFile );
		await mkdir( dirname( outputFilePath ), { recursive: true } );
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
