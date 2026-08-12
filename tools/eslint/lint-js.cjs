#!/usr/bin/env node
'use strict';

const { spawn } = require( 'node:child_process' );
const path = require( 'node:path' );
const fs = require( 'node:fs' );

const STALE_SUPPRESSIONS_TOKEN = '--prune-suppressions';

const PRUNE_HELP_MESSAGE =
	'👉 Run `npm run lint:js:prune-suppressions` and commit the updated `tools/eslint/suppressions.json`.';

const SUPPRESSIONS_FILE = path.join( __dirname, 'suppressions.json' );

const userArgs = process.argv.slice( 2 );
const args = userArgs.some( ( arg ) =>
	arg.startsWith( '--suppressions-location' )
)
	? userArgs
	: [ '--suppressions-location', SUPPRESSIONS_FILE, ...userArgs ];
const wpScriptsBin = require.resolve( '@wordpress/scripts/bin/wp-scripts.js' );

const FORMAT_FLAGS = [ '-f', '--format' ];

function resolveFormatter( name ) {
	if (
		name.startsWith( '/' ) ||
		name.startsWith( './' ) ||
		name.startsWith( '../' ) ||
		/^[A-Za-z]:\\/.test( name )
	) {
		return name;
	}

	for ( const candidate of [ name, `eslint-formatter-${ name }` ] ) {
		try {
			return require.resolve( candidate, { paths: [ __dirname ] } );
		} catch {}
	}

	throw new Error(
		`Formatter "${ name }" not found. Install the corresponding eslint-formatter-<name> package in tools/eslint/ or use a built-in formatter (stylish, json, etc.).`
	);
}

const childArgs = args.map( ( arg, index ) => {
	if ( FORMAT_FLAGS.includes( args[ index - 1 ] ) ) {
		return resolveFormatter( arg );
	}

	for ( const flag of FORMAT_FLAGS ) {
		if ( arg.startsWith( `${ flag }=` ) ) {
			return `${ flag }=${ resolveFormatter(
				arg.slice( flag.length + 1 )
			) }`;
		}
	}

	return arg;
} );

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

const child = spawn(
	process.execPath,
	[ wpScriptsBin, 'lint-js', ...childArgs ],
	{
		stdio: [ 'inherit', 'pipe', 'pipe' ],
		env: childEnv,
	}
);

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

	// ESLint writes the suppressions file with two-space indentation
	// when invoked with `--prune-suppressions`. Format it through the
	// repo's Prettier config so the working-tree diff matches what
	// lint-staged would produce on commit. Done here (rather than in the
	// npm script) so it runs even when the lint pass exits non-zero from
	// unrelated errors elsewhere in the codebase.
	if (
		args.includes( STALE_SUPPRESSIONS_TOKEN ) &&
		fs.existsSync( SUPPRESSIONS_FILE )
	) {
		formatSuppressionsFile( code );
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

/**
 * @param {number|null} lintExitCode Exit code from the lint child process.
 */
function formatSuppressionsFile( lintExitCode ) {
	const formatChild = spawn(
		process.execPath,
		[ wpScriptsBin, 'format', SUPPRESSIONS_FILE ],
		{ stdio: 'inherit', env: childEnv }
	);

	formatChild.on( 'error', ( error ) => {
		throw error;
	} );

	formatChild.on( 'close', ( formatCode, formatSignal ) => {
		if ( formatSignal ) {
			process.kill( process.pid, formatSignal );
			return;
		}

		process.exitCode = resolveExitCode( lintExitCode, formatCode );
	} );
}

/**
 * @param {number|null} lintExitCode Exit code from the lint child process.
 * @param {number|null} formatCode   Exit code from the format child process.
 * @return {number} Exit code to use for the wrapper process.
 */
function resolveExitCode( lintExitCode, formatCode ) {
	if ( lintExitCode !== null && lintExitCode !== 0 ) {
		return lintExitCode;
	}

	return formatCode ?? lintExitCode ?? 1;
}
