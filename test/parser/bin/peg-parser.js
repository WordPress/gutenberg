#!/usr/bin/env node

/**
 * Node Dependencies
 */
const fs = require( 'fs' );

/**
 * Internal Dependencies
 */
const parser = require( './parser' );

const args = process.argv.slice( 2 );

function parserFromFile( fileInput, fileOutput ) {
	const input = fs.readFileSync( fileInput, 'utf8' );
	const output = parser.parse( input );

	fs.writeFileSync( fileOutput, JSON.stringify( output ) );
}

parserFromFile(
	args[ 0 ],
	args[ 1 ]
);
