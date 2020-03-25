/**
 * External dependencies
 */
const execa = require( 'execa' );

/* eslint-disable no-console */
try {
	execa.sync( 'npm', [ 'run', 'build:package-types' ] );
} catch ( err ) {
	console.error( err.message );
	process.exitCode = 1;
}
/* eslint-enable no-console */
