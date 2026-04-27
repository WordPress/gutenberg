/**
 * External dependencies
 */
const chalk = require( 'chalk' );

// Formats.
const title = chalk.bold;
const error = chalk.bold.red;
const warning = chalk.bold.keyword( 'orange' );
const success = chalk.bold.green;

// eslint-disable-next-line no-console
const log = console.log;

module.exports = {
	log,
	formats: {
		title,
		error,
		warning,
		success,
	},
};
