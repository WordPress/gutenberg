#!/usr/bin/env node

/**
 * Generates SCSS from breakpoints.ts
 *
 * This script reads the canonical breakpoints.ts file and generates:
 * - _breakpoints.scss (SCSS variables)
 */

const fs = require( 'fs' );
const path = require( 'path' );

const BASE_DIR = path.join( __dirname, '..' );
const BREAKPOINTS_TS = path.join( BASE_DIR, 'src', 'breakpoints.ts' );

// Read and parse the TypeScript source
let breakpoints;
try {
	const content = fs.readFileSync( BREAKPOINTS_TS, 'utf8' );

	// Extract the object literal from the TypeScript file
	const match = content.match( /const BREAKPOINTS = \{([^}]+)\}/ );
	if ( ! match ) {
		throw new Error(
			'Could not find BREAKPOINTS object in breakpoints.ts'
		);
	}

	// Parse the object entries
	breakpoints = {};
	const entries = match[ 1 ].trim().split( /,\s*\n/ );
	entries.forEach( ( entry ) => {
		const [ key, value ] = entry
			.trim()
			.split( ':' )
			.map( ( s ) => s.trim() );
		if ( key && value ) {
			const cleanKey = key.replace( /['"]/g, '' );
			const cleanValue = parseInt( value, 10 );
			if ( ! isNaN( cleanValue ) ) {
				breakpoints[ cleanKey ] = cleanValue;
			}
		}
	} );
} catch ( error ) {
	/* eslint-disable no-console */
	console.error( '❌ Error reading breakpoints.ts:', error.message );
	/* eslint-enable no-console */
	process.exit( 1 );
}

// Generate SCSS
const scssContent = `/**
 * Breakpoints & Media Queries
 *
 * ⚠️  AUTO-GENERATED FILE - DO NOT EDIT DIRECTLY
 * This file is generated from breakpoints.ts
 * Run 'npm run build' in the base-styles package to regenerate
 * See BREAKPOINTS.md for usage documentation
 */

${ Object.entries( breakpoints )
	.map( ( [ name, value ] ) => `$break-${ name }: ${ value }px;` )
	.join( '\n' ) }
`;

// Write file
try {
	fs.writeFileSync( path.join( BASE_DIR, '_breakpoints.scss' ), scssContent );
	/* eslint-disable no-console */
	console.log( '✅ SCSS generated successfully from breakpoints.ts' );
	console.log( '   - _breakpoints.scss' );
} catch ( error ) {
	console.error( '❌ Error writing generated file:', error.message );
	process.exit( 1 );
	/* eslint-enable no-console */
}
