/* eslint-disable no-console */
/**
 * External dependencies
 */
const chalk = require( 'chalk' );

const clear = () => {
	process.stdout.write(
		process.platform === 'win32' ? '\x1B[2J\x1B[0f' : '\x1B[2J\x1B[3J\x1B[H'
	);
};

const code = ( input ) => {
	console.log( chalk.cyan( input ) );
};

const error = ( input ) => {
	console.log( chalk.bold.red( input ) );
};

const info = ( input ) => {
	console.log( input );
};
const success = ( input ) => {
	console.log( chalk.bold.green( input ) );
};

module.exports = {
	code,
	clear,
	error,
	info,
	success,
};
/* eslint-enable no-console */
