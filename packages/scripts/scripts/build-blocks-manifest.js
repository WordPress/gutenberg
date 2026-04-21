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

// Parses command line arguments.
const defaultInputDir = 'build';
const inputDir = getArgFromCLI( '--input' ) || defaultInputDir;
const defaultOutputFile = path.join( inputDir, 'blocks-manifest.php' );
const outputFile = getArgFromCLI( '--output' ) || defaultOutputFile;

const resolvedInputDir = path.resolve( process.cwd(), inputDir );
if ( ! fs.existsSync( resolvedInputDir ) ) {
	const ERROR = chalk.reset.inverse.bold.red( ' ERROR ' );
	process.stdout.write(
		`${ ERROR } Input directory "${ resolvedInputDir }" does not exist.\n`
	);
	process.exit( 1 );
}

// Find all block.json files
const blockJsonFiles = glob( './**/block.json', {
	cwd: resolvedInputDir,
	absolute: true,
} );

const blocks = {};

blockJsonFiles.forEach( ( file ) => {
	const blockJson = JSON.parse( fs.readFileSync( file, 'utf8' ) );
	const directoryName = path.basename( path.dirname( file ) );
	blocks[ directoryName ] = blockJson;
} );

if ( Object.keys( blocks ).length === 0 ) {
	const ERROR = chalk.reset.inverse.bold.red( ' ERROR ' );
	process.stdout.write(
		`${ ERROR } No block.json files were found in path: ${ inputDir }.\n`
	);
	process.exit( 1 );
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
