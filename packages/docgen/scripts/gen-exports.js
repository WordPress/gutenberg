/**
 * External dependencies
 */
const ts = require( 'typescript' );
const { readFileSync, writeFileSync, readdirSync } = require( 'fs' );
const { join, dirname } = require( 'path' );

/**
 * Internal dependencies
 */
const { getExportStatements } = require( '../src/get-export-statements' );

const getCircularReplacer = () => {
	const seen = new WeakSet();
	return ( _key, value ) => {
		if ( typeof value === 'object' && value !== null ) {
			if ( seen.has( value ) ) {
				return;
			}
			seen.add( value );
		}
		return value;
	};
};

function generateExportJson( filename ) {
	const sourceFile = ts.createSourceFile(
		filename,
		readFileSync( filename ).toString(),
		ts.ScriptTarget.ES2020
	);
	const statements = getExportStatements( sourceFile );

	const json = JSON.stringify(
		statements.length === 1 ? statements[ 0 ] : statements,
		getCircularReplacer(),
		2
	);

	const dir = dirname( filename );
	const jsonFilename = join( dir, 'exports.json' );

	writeFileSync( jsonFilename, json );
}

const fixturesDir = join( __dirname, '..', './src/test/fixtures/' );

readdirSync( fixturesDir, { withFileTypes: true } )
	.filter( ( dirent ) => dirent.isDirectory() )
	.map( ( dirent ) => dirent.name )
	.forEach( ( name ) => {
		generateExportJson( join( fixturesDir, name, 'code.js' ) );
	} );
