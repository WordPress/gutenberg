const { createRequire } = require( 'node:module' );
const path = require( 'node:path' );
const { pathToFileURL } = require( 'node:url' );

// Resolve the consumer's runner so its config, plugins, and tests share Vitest.
const consumerRequire = createRequire( path.resolve( 'package.json' ) );
let vitestCli;
try {
	const manifestPath = consumerRequire.resolve( 'vitest/package.json' );
	vitestCli = path.resolve(
		path.dirname( manifestPath ),
		consumerRequire( 'vitest/package.json' ).bin.vitest
	);
} catch ( error ) {
	if ( error.code !== 'MODULE_NOT_FOUND' ) {
		throw error;
	}
	console.error(
		'wp-scripts test-unit-js requires Vitest 5 and Vite 7 or 8. ' +
			'Install Vitest with npm install --save-dev vitest@^5. ' +
			'For a new setup, install Vite with npm install --save-dev vite@^8. Existing Vite 7 or 8 installations can be kept. ' +
			'To keep using Jest, switch your command to wp-scripts test-unit-jest and follow ' +
			'https://github.com/WordPress/gutenberg/blob/HEAD/packages/scripts/docs/vitest-migration.md#keep-an-existing-jest-suite.'
	);
	process.exit( 1 );
}

// Run once by default, including in a terminal. Leave explicit watch options
// and Vitest's watch subcommands to the native CLI parser.
const args = process.argv.slice( 2 );
const hasWatchOption =
	args[ 0 ] === 'watch' ||
	args[ 0 ] === 'dev' ||
	args.some( ( arg ) => /^(--watch(?:=|$)|--no-watch$|-w$)/.test( arg ) );
process.argv = [
	process.execPath,
	vitestCli,
	...( hasWatchOption ? [] : [ '--watch=false' ] ),
	...args,
];
import( pathToFileURL( vitestCli ).href ).catch( ( error ) => {
	console.error( error );
	process.exitCode = 1;
} );
