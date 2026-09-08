#!/usr/bin/env node
import { once } from 'events';
import path from 'path';
import readline from 'readline';
import { fileURLToPath } from 'url';
import spawn from 'cross-spawn';

const __dirname = path.dirname( fileURLToPath( import.meta.url ) );
const ROOT_DIR = path.resolve( __dirname, '../..' );

const ANSI = /\u001B\[[0-9;]*m/g;
const CYAN = '\u001B[96m';
const RESET = '\u001B[0m';

/* Bookkeeping `--verbose` adds: status lines and the project list one heads. */
const STATUS = /^\[\d{1,2}:\d{2}:\d{2}(?: [AP]M)?\] /;
const LISTED_PROJECT = /^\s+\* .+\.json$/;
const BUILDING = /Building project '(.+)'/;

/*
 * A diagnostic tsc placed on no file, which is what a `types` entry inherited
 * through `extends` produces. Without the project there is nothing to grep.
 */
const UNPLACED = /^error TS\d+: /;

const args = process.argv.slice( 2 );
const verbatim = args.includes( '--verbose' );

/*
 * `--pretty` keeps related info tsc drops when stdout is not a TTY, as in CI.
 * `--verbose` is the only thing naming the project behind an unplaced
 * diagnostic; its bookkeeping is dropped again below.
 */
const child = spawn( 'tsc', [ '--build', '--pretty', '--verbose', ...args ], {
	cwd: ROOT_DIR,
	stdio: [ 'inherit', 'pipe', 'inherit' ],
} );

let project = '';
let dropped = false;

const output = readline.createInterface( {
	input: child.stdout,
	crlfDelay: Infinity,
} );

output.on( 'line', ( line ) => {
	const text = line.replace( ANSI, '' );

	if ( STATUS.test( text ) ) {
		project = BUILDING.exec( text )?.[ 1 ] ?? project;
	}

	if ( ! verbatim ) {
		// Every dropped entry is followed by a blank line of its own.
		if ( STATUS.test( text ) || LISTED_PROJECT.test( text ) ) {
			dropped = true;
			return;
		}
		if ( dropped && ! text.trim() ) {
			dropped = false;
			return;
		}
		dropped = false;
	}

	process.stdout.write(
		UNPLACED.test( text ) && project
			? `${ CYAN }${ project }${ RESET } - ${ line }\n`
			: `${ line }\n`
	);
} );

/*
 * Both, so no line is still queued: piped writes are asynchronous, and
 * `process.exit()` would drop whatever has not flushed yet.
 */
const [ [ code ] ] = await Promise.all( [
	once( child, 'close' ),
	once( output, 'close' ),
] );

if ( code !== 0 ) {
	// Same failure hint as the build, so a red CI run points at the fix.
	console.error(
		'\n❌ Type check failed. Try cleaning up first: `npm run clean:package-types`'
	);
}

process.exitCode = code ?? 1;
