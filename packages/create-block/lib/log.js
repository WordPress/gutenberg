/* eslint-disable no-console */
/**
 * External dependencies
 */
const chalk = require( 'chalk' );

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
	error,
	info,
	success,
};
/* eslint-enable no-console */
