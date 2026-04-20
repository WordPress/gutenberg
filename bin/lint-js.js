#!/usr/bin/env node
'use strict';

const { spawn } = require( 'node:child_process' );

const STALE_SUPPRESSIONS_TOKEN = '--prune-suppressions';

const PRUNE_HELP_MESSAGE =
	'👉 Run `npm run lint:js:prune-suppressions` and commit the updated `eslint-suppressions.json`.';

const args = process.argv.slice( 2 );
const wpScriptsBin = require.resolve( '../packages/scripts/bin/wp-scripts.js' );

// Detect stale suppressions by scanning the child's output for ESLint's
// own `--prune-suppressions` hint. A small sliding tail buffer is used so
// the child's output can be streamed straight to the user instead of being
// buffered in full.
const tailLength = STALE_SUPPRESSIONS_TOKEN.length - 1;
let outputTail = '';
let staleSuppressionsDetected = false;

// The child's stdout/stderr are pipes (not TTYs) so it can be scanned, which
// would otherwise disable color in ESLint's output. Re-enable color when the
// parent has a TTY so interactive runs look the same as the unwrapped command.
const childEnv = { ...process.env };
if (
	childEnv.FORCE_COLOR === undefined &&
	( process.stdout.isTTY || process.stderr.isTTY )
) {
	childEnv.FORCE_COLOR = '1';
}

const child = spawn( process.execPath, [ wpScriptsBin, 'lint-js', ...args ], {
	stdio: [ 'inherit', 'pipe', 'pipe' ],
	env: childEnv,
} );

child.stdout.on( 'data', handleChunk( process.stdout ) );
child.stderr.on( 'data', handleChunk( process.stderr ) );

child.on( 'error', ( error ) => {
	throw error;
} );

child.on( 'close', ( code, signal ) => {
	if ( shouldShowPruneHint() ) {
		process.stderr.write( `\n${ PRUNE_HELP_MESSAGE }\n` );
	}

	if ( signal ) {
		process.kill( process.pid, signal );
		return;
	}

	process.exitCode = code ?? 1;
} );

/**
 * @param {NodeJS.WritableStream} destination Stream to forward chunks to.
 *
 * @return {(chunk: Buffer) => void} Data event handler.
 */
function handleChunk( destination ) {
	return ( chunk ) => {
		destination.write( chunk );
		scanForStaleSuppressions( chunk );
	};
}

/**
 * @param {Buffer} chunk Chunk of child output.
 */
function scanForStaleSuppressions( chunk ) {
	if ( staleSuppressionsDetected ) {
		return;
	}

	const window = outputTail + chunk.toString( 'utf8' );

	if ( window.includes( STALE_SUPPRESSIONS_TOKEN ) ) {
		staleSuppressionsDetected = true;
		outputTail = '';
		return;
	}

	outputTail = window.slice( -tailLength );
}

/**
 * @return {boolean} Whether to print the repo-specific prune hint.
 */
function shouldShowPruneHint() {
	return (
		staleSuppressionsDetected &&
		! args.includes( '--pass-on-unpruned-suppressions' ) &&
		! args.includes( STALE_SUPPRESSIONS_TOKEN )
	);
}
