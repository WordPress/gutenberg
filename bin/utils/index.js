/**
 * External dependencies
 */
const fs = require( 'fs' );
const childProcess = require( 'child_process' );
const inquirer = require( 'inquirer' );
const chalk = require( 'chalk' );

const error = chalk.bold.red;

/**
 * Small utility used to read an uncached version of a JSON file
 *
 * @param {string} fileName
 */
function readJSONFile( fileName ) {
	const data = fs.readFileSync( fileName, 'utf8' );
	return JSON.parse( data );
}

/**
 * Utility to run a child script
 *
 * @param {string} script Script to run.
 * @param {string} cwd    Working directory.
 */
function runShellScript( script, cwd ) {
	childProcess.execSync( script, {
		cwd,
		env: {
			NO_CHECKS: true,
			PATH: process.env.PATH,
			HOME: process.env.HOME,
		},
		stdio: [ 'inherit', 'ignore', 'inherit' ],
	} );
}

/**
 * Asks the user for a confirmation to continue or abort otherwise
 *
 * @param {string} message      Confirmation message.
 * @param {boolean} isDefault   Default reply.
 * @param {string} abortMessage Abort message.
 */
async function askForConfirmationToContinue( message, isDefault = true, abortMessage = 'Aborting.' ) {
	const { isReady } = await inquirer.prompt( [ {
		type: 'confirm',
		name: 'isReady',
		default: isDefault,
		message,
	} ] );

	if ( ! isReady ) {
		/* eslint-disable no-console */
		console.log( error( '\n' + abortMessage ) );
		/* eslint-enable no-console */
		process.exit( 1 );
	}
}

module.exports = {
	readJSONFile,
	runShellScript,
	askForConfirmationToContinue,
};
