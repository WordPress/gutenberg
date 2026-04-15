#!/usr/bin/env node
'use strict';

const { sync: spawn } = require( 'cross-spawn' );

const STALE_SUPPRESSIONS_MESSAGE =
	'There are suppressions left that do not occur anymore.';

const PRUNE_HELP_MESSAGE =
	'Stale ESLint suppressions detected. Run `npm run lint:js:prune-suppressions` and commit the updated `eslint-suppressions.json`.';

const args = process.argv.slice( 2 );
const wpScriptsBin = require.resolve( '../packages/scripts/bin/wp-scripts.js' );

const result = spawn( process.execPath, [ wpScriptsBin, 'lint-js', ...args ], {
	encoding: 'utf8',
} );

if ( result.error ) {
	throw result.error;
}

if ( result.stdout ) {
	process.stdout.write( result.stdout );
}

if ( result.stderr ) {
	process.stderr.write( result.stderr );
}

if ( shouldShowPruneHelp( result, args ) ) {
	process.stderr.write( `\n${ PRUNE_HELP_MESSAGE }\n` );
}

process.exit( result.status ?? 1 );

/**
 * @param {import( 'cross-spawn' ).SpawnSyncReturns<string>} lintResult Spawn result.
 * @param {string[]}                                         cliArgs    Passed CLI arguments.
 *
 * @return {boolean} Whether the custom prune guidance should be shown.
 */
function shouldShowPruneHelp( lintResult, cliArgs ) {
	const output = `${ lintResult.stdout ?? '' }\n${ lintResult.stderr ?? '' }`;

	return (
		! cliArgs.includes( '--pass-on-unpruned-suppressions' ) &&
		! cliArgs.includes( '--prune-suppressions' ) &&
		output.includes( STALE_SUPPRESSIONS_MESSAGE )
	);
}
