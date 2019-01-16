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
	process.stdout.write( '\nUsage: <path-to-docgen> <gutenberg-package-name>\n\n\n' );
	process.exit( 1 );
}

const root = path.join( __dirname, '../../../' );
// TODO:
// - take input file from package.json?
// - make CLI take input file instead of package?
const input = path.join( root, `packages/${ packageName }/src/index.js` );
const output = path.join( root, `packages/${ packageName }/api.md` );

fs.readFile( input, 'utf8', ( err, data ) => {
	if ( err ) {
		process.stdout.write( `\n${ input } does not exists.\n\n\n` );
		process.exit( 1 );
	}

	const json = engine( data );
	const docs = formatter( json );
	fs.writeFileSync( output, docs );
} );
