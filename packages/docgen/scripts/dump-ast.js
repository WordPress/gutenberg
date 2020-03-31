/**
 * External dependencies
 */
const ts = require( 'typescript' );
const { readFileSync } = require( 'fs' );
const { inspect } = require( 'util' );

const filename = process.argv[ 2 ];

const sourceFile = ts.createSourceFile(
	filename,
	readFileSync( filename ).toString(),
	ts.ScriptTarget.ESNext
);

// eslint-disable-next-line no-console
console.log( inspect( sourceFile, false, null ) );
