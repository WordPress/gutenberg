/**
 * External dependencies
 */
const fs = require( 'fs' );
const path = require( 'path' );
const { sync: glob } = require( 'fast-glob' );
const json2php = require( 'json2php' );
const chalk = require( 'chalk' );

/**
 * Internal dependencies
 */
const { getArgFromCLI } = require( '../utils' );

// Set default paths
const defaultInputDir = 'build';
const defaultOutputFile = path.join( 'build', 'blocks-manifest.php' );

// Parse command line arguments
const inputDir = getArgFromCLI( '--input' ) || defaultInputDir;
const outputFile = getArgFromCLI( '--output' ) || defaultOutputFile;

// Find all block.json files
const blockJsonFiles = glob( './**/block.json', {
	cwd: path.resolve( process.cwd(), inputDir ),
	absolute: true,
} );

const blocks = {};

blockJsonFiles.forEach( ( file ) => {
	const blockJson = JSON.parse( fs.readFileSync( file, 'utf8' ) );
	const directoryName = path.basename( path.dirname( file ) );
	blocks[ directoryName ] = blockJson;
} );

if ( Object.keys( blocks ).length === 0 ) {
	const WARNING = chalk.reset.inverse.bold.yellow( ' WARNING ' );
	process.stdout.write(
		`${ WARNING } No block.json files were found in path: ${ inputDir }. Generated file will be empty.\n`
	);
}

// Generate PHP content
const printer = json2php.make( { linebreak: '\n', indent: '\t' } );
const phpContent = `<?php
// This file is generated. Do not modify it manually.
return ${ printer( blocks ) };
`;

// Ensure output directory exists
const outputDir = path.dirname( outputFile );
if ( ! fs.existsSync( outputDir ) ) {
	fs.mkdirSync( outputDir, { recursive: true } );
}

// Write the file
fs.writeFileSync( outputFile, phpContent );

process.stdout.write(
	`Block metadata PHP file generated at: ${ outputFile }\n`
);
