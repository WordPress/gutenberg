/* eslint-disable no-console */
/**
 * Validates all block.json files in the repo against the block.json schema.
 *
 * Usage: node test/integration/validate-block-json-schema.js
 */
const Ajv = require( 'ajv' );
const glob = require( 'fast-glob' );
const path = require( 'path' );

const ROOT_DIR = path.resolve( __dirname, '../..' );
const schema = require( path.join( ROOT_DIR, 'schemas/json/block.json' ) );

const ajv = new Ajv();
const files = glob.sync(
	[ 'packages/*/src/**/block.json', '{lib,phpunit,test}/**/block.json' ],
	{ onlyFiles: true, absolute: true, cwd: ROOT_DIR }
);

let failed = 0;
for ( const f of files ) {
	try {
		const meta = require( f );
		if ( ! ajv.validate( schema, meta ) ) {
			console.log(
				'FAIL:',
				path.relative( ROOT_DIR, f ),
				JSON.stringify( ajv.errors )
			);
			failed++;
		}
	} catch ( e ) {
		console.log( 'ERROR:', path.relative( ROOT_DIR, f ), e.message );
		failed++;
	}
}

console.log(
	`\nResults: ${ files.length } files found, ${ failed } failed, ${
		files.length - failed
	} passed.`
);
process.exit( failed > 0 ? 1 : 0 );
