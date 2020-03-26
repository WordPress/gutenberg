/**
 * External dependencies
 */
const execa = require( 'execa' );

/* eslint-disable no-console */
try {
	// This trivial command is necessary to invoke `tsc` via `lint-staged`
	//
	// `lint-staged` passes changed files to the script. That would result in
	// attempting to run `tsc --build path/to/changed/file.js`, which does not
	// correspond to a project (a directory with a `tsconfig.json` files)!
	//
	// Run here to ignore changed files.
	execa.sync( 'npm', [ 'run', 'build:package-types' ] );
} catch ( err ) {
	console.error( err.message );
	process.exitCode = 1;
}
/* eslint-enable no-console */
