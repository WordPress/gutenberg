#!/usr/bin/env node
import path from 'path';
import readline from 'readline';
import { fileURLToPath } from 'url';
import spawn from 'cross-spawn';
import { createLineTransform } from './typecheck-helpers.mjs';

const __dirname = path.dirname( fileURLToPath( import.meta.url ) );
const ROOT_DIR = path.resolve( __dirname, '../..' );

const args = process.argv.slice( 2 );

/*
 * `--pretty` keeps related info tsc drops when stdout is not a TTY, as in CI.
 * `--verbose` alone names the project behind an unplaced diagnostic.
 */
const child = spawn( 'tsc', [ '--build', '--pretty', '--verbose', ...args ], {
	cwd: ROOT_DIR,
	stdio: [ 'inherit', 'pipe', 'inherit' ],
} );

const transform = createLineTransform( args.includes( '--verbose' ) );

const output = readline.createInterface( {
	input: child.stdout,
	crlfDelay: Infinity,
} );

output.on( 'line', ( line ) => {
	const transformed = transform( line );
	if ( transformed !== null ) {
		process.stdout.write( `${ transformed }\n` );
	}
} );

/*
 * Await both, so no line is still queued: piped writes are asynchronous, and
 * `process.exit()` would drop whatever has not flushed yet.
 */
const [ status ] = await Promise.all( [
	new Promise( ( resolve ) => {
		// A failure to spawn ends in `close` as well, so resolve on whichever.
		child.on( 'error', ( error ) => {
			console.error( error.message );
			resolve( null );
		} );
		child.on( 'close', resolve );
	} ),
	new Promise( ( resolve ) => output.on( 'close', resolve ) ),
] );

if ( status !== 0 ) {
	// Same failure hint as the build, so a red CI run points at the fix.
	console.error(
		'\n❌ Type check failed. Try cleaning up first: `npm run clean:package-types`'
	);
	// A signal or a failure to spawn leaves no status to exit with.
	process.exitCode = status > 0 ? status : 1;
}
