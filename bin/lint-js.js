#!/usr/bin/env node
'use strict';

const { spawnSync } = require( 'node:child_process' );

const STALE_SUPPRESSIONS_PATTERN = new RegExp(
	[
		'There are suppressions left that do not occur anymore\\.',
		'To resolve this, re-run the command with `--prune-suppressions` to remove unused suppressions\\.',
		'To ignore unused suppressions, use `--pass-on-unpruned-suppressions`\\.',
	].join( '\\s+' )
);

const PRUNE_HELP_MESSAGE =
	'Stale ESLint suppressions detected. Run `npm run lint:js:prune-suppressions` and commit the updated `eslint-suppressions.json`.';

const args = process.argv.slice( 2 );
const wpScriptsBin = require.resolve( '../packages/scripts/bin/wp-scripts.js' );

const result = spawnSync(
	process.execPath,
	[ wpScriptsBin, 'lint-js', ...args ],
	{
		encoding: 'utf8',
	}
);

if ( result.error ) {
	throw result.error;
}

const stdout = stripStaleSuppressionsMessage( result.stdout );
const stderr = stripStaleSuppressionsMessage( result.stderr );

if ( stdout ) {
	process.stdout.write( stdout );
}

if ( stderr ) {
	process.stderr.write( stderr );
}

if ( hasStaleSuppressions( result, args ) ) {
	process.stderr.write( `\n${ PRUNE_HELP_MESSAGE }\n` );
}

process.exit( result.status ?? 1 );

/**
 * @param {import( 'node:child_process' ).SpawnSyncReturns<string>} lintResult Spawn result.
 * @param {string[]}                                                cliArgs    Passed CLI arguments.
 *
 * @return {boolean} Whether stale suppressions were detected.
 */
function hasStaleSuppressions( lintResult, cliArgs ) {
	const output = `${ lintResult.stdout ?? '' }\n${ lintResult.stderr ?? '' }`;

	return (
		! cliArgs.includes( '--pass-on-unpruned-suppressions' ) &&
		! cliArgs.includes( '--prune-suppressions' ) &&
		STALE_SUPPRESSIONS_PATTERN.test( output )
	);
}

/**
 * @param {string|undefined} output Process output.
 *
 * @return {string} Output without ESLint's generic stale suppressions message.
 */
function stripStaleSuppressionsMessage( output ) {
	return ( output ?? '' ).replace( STALE_SUPPRESSIONS_PATTERN, '' );
}
