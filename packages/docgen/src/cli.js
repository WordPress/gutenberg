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

const packageName = 'i18n';
const root = path.resolve( __dirname, '../../../' );
const input = path.resolve( root, `packages/${ packageName }/src/index.js` );
const output = path.resolve( root, `packages/${ packageName }/src/doc-api.md` );

const code = fs.readFileSync( input, 'utf8' );
const json = engine( code );
const docs = formatter( json );

fs.writeFileSync( output, docs );
