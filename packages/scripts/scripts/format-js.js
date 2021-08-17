/**
 * External dependencies
 */
const chalk = require( 'chalk' );

/**
 * Internal dependencies
 */
const { getNodeArgsFromCLI, spawnScript } = require( '../utils' );

const { scriptArgs, nodeArgs } = getNodeArgsFromCLI();

const keypress = async () => {
	process.stdin.setRawMode( true );
	return new Promise( ( resolve ) =>
		process.stdin.once( 'data', () => {
			process.stdin.setRawMode( false );
			resolve();
		} )
	);
};

( async () => {
	const message =
		`Please note that the ${ chalk.red(
			'format-js'
		) } script has been renamed to ${ chalk.green( 'format' ) }.\n` +
		"If you're calling it from any of your own scripts, please update them accordingly.\n" +
		'Press any key to continue.';

	// eslint-disable-next-line no-console
	console.log( message );

	await keypress();
	spawnScript( 'format', scriptArgs, nodeArgs );
} )();
