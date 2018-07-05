#!/usr/bin/env node

/**
 * Node Dependencies
 */
const getStdin = require( 'get-stdin' );

/**
 * Internal dependencies
 */
const parser = require( './parser' );

getStdin().then( input => {
	process.stdout.write( JSON.stringify( parser.parse( input ) ) );
} );
