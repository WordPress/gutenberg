/**
 * External dependencies
 */
const chalk = require( 'chalk' );

// Formats.
const title = chalk.bold;
const error = chalk.bold.red;
const warning = chalk.bold.keyword( 'orange' );
const success = chalk.bold.green;

const log = console.log;

// Warnings go to stderr so that they stay out of command output that callers
// redirect and reuse, such as generated release notes.
const warn = console.warn;

module.exports = {
	log,
	warn,
	formats: {
		title,
		error,
		warning,
		success,
	},
};
