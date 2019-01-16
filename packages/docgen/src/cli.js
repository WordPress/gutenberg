/**
 * Node dependencies.
 */
const fs = require( 'fs' );
const path = require( 'path' );

/**
 * Internal dependencies.
 */
const engine = require( './engine' );
const formatter = require( './formatter' );

const packageName = process.argv[ 2 ];
if ( packageName === undefined ) {
	process.stdout.write( '\nUsage: <path-to-docgen> <gutenberg-package-name>\n' );
	process.exit( 1 );
}

const root = path.resolve( __dirname, '../../../' );
const input = path.resolve( root, `packages/${ packageName }/src/index.js` );
const output = path.resolve( root, `packages/${ packageName }/src/doc-api.md` );

const code = fs.readFileSync( input, 'utf8' );
const json = engine( code );
const docs = formatter( json );

fs.writeFileSync( output, docs );
