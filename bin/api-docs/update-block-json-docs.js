#!/usr/bin/env node

/**
 * External dependencies
 */
const { readFileSync } = require( 'fs' );
const glob = require( 'fast-glob' );

let paths = process.argv.slice( 2 );

if ( paths.length === 0 ) {
	// This requires executing the script from the top-level
	// Gutenberg directory.
	paths = glob.sync( 'packages/**/block.json', {
		cwd: process.cwd(),
	} );

	if ( paths.length === 0 ) {
		process.exit( 0 );
	}
}

const blocks = {};
paths.forEach( ( path ) => {
	maybeUpdateDocs( blocks, path );
} );

function maybeUpdateDocs( blockList, path ) {
	const content = readFileSync( path, 'utf8' );
	const blockDefinition = JSON.parse( content );
	const supports = {};

	// ― Process colors

	// Background and text color are also supported
	// if the color key is present and they haven't
	// been explicitely disabled.
	[ 'background', 'text' ].forEach( ( key ) => {
		if (
			blockDefinition?.supports?.hasOwnProperty( 'color' ) &&
			! blockDefinition?.supports?.color?.hasOwnProperty( key )
		) {
			supports[ key + 'Color' ] = true;
		}
	} );
	[ 'background', 'text', 'gradients', 'link' ].forEach( ( key ) => {
		if ( blockDefinition?.supports?.color?.[ key ] ) {
			supports[ key + 'Color' ] = true;
		}
	} );

	// ― Process opt-ins.
	[ 'align', 'fontSize', 'lineHeight', 'padding' ].forEach( ( key ) => {
		if ( blockDefinition?.supports?.[ key ] ) {
			supports[ key ] = true;
		}
	} );

	// ― Process opt-outs.
	[ 'alignWide', 'className' ].forEach( ( key ) => {
		if (
			! Object( blockDefinition?.supports ).hasOwnProperty( key ) ||
			blockDefinition?.supports?.[ key ]
		) {
			supports[ key ] = true;
		}
	} );

	if ( Object.keys( supports ).length > 0 ) {
		blockList[ blockDefinition.name ] = supports;
	}
}

console.table( blocks, [
	'align',
	'alignWide',
	'className',
	'backgroundColor',
	'textColor',
	'gradientsColor',
	'linkColor',
	'fontSize',
	'lineHeight',
] );

process.exit( 1 );
