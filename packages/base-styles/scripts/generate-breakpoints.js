#!/usr/bin/env node

/**
 * Generates breakpoint files from breakpoints.json
 *
 * This script reads the canonical breakpoints.json file and generates:
 * - _breakpoints.scss (SCSS variables)
 * - breakpoints.ts (TypeScript module)
 */

const fs = require( 'fs' );
const path = require( 'path' );

const BASE_DIR = path.join( __dirname, '..' );
const BREAKPOINTS_JSON = path.join( BASE_DIR, 'src/breakpoints.json' );

// Read the source JSON
let breakpoints;
try {
	const content = fs.readFileSync( BREAKPOINTS_JSON, 'utf8' );
	breakpoints = JSON.parse( content );
} catch ( error ) {
	/* eslint-disable no-console */
	console.error( '❌ Error reading breakpoints.json:', error.message );
	/* eslint-enable no-console */
	process.exit( 1 );
}

// Generate SCSS
const scssContent = `/**
 * Breakpoints & Media Queries
 *
 * ⚠️  AUTO-GENERATED FILE - DO NOT EDIT DIRECTLY
 * This file is generated from breakpoints.json
 * Run 'npm run build' in the base-styles package to regenerate
 * See BREAKPOINTS.md for usage documentation
 */

${ Object.entries( breakpoints )
	.map( ( [ name, value ] ) => `$break-${ name }: ${ value }px;` )
	.join( '\n' ) }
`;

// Generate TypeScript module
// Convert to properly formatted object for prettier compliance
const tsObject = Object.entries( breakpoints )
	.map( ( [ key, value ] ) => {
		// Only quote keys that need it (contain special chars like hyphens)
		const quotedKey = /^[a-z]+$/i.test( key ) ? key : `'${ key }'`;
		return `\t${ quotedKey }: ${ value },`;
	} )
	.join( '\n' );

const tsContent = `/**
 * Breakpoints
 *
 * ⚠️  AUTO-GENERATED FILE - DO NOT EDIT DIRECTLY
 * This file is generated from breakpoints.json
 * Run 'npm run build' in the base-styles package to regenerate
 */

const breakpoints = {
${ tsObject }
} as const;

export default breakpoints;
`;

// Write files
try {
	fs.writeFileSync( path.join( BASE_DIR, '_breakpoints.scss' ), scssContent );
	fs.writeFileSync( path.join( BASE_DIR, 'src/breakpoints.ts' ), tsContent );
	/* eslint-disable no-console */
	console.log( '✅ Breakpoints generated successfully:' );
	console.log( '   - _breakpoints.scss' );
	console.log( '   - breakpoints.ts' );
} catch ( error ) {
	console.error( '❌ Error writing generated files:', error.message );
	process.exit( 1 );
	/* eslint-enable no-console */
}
