/**
 * External dependencies
 */
// @ts-ignore
const inquirer = require( 'inquirer' );
const fs = require( 'fs' );
const childProcess = require( 'child_process' );
const { v4: uuid } = require( 'uuid' );
const path = require( 'path' );
const os = require( 'os' );

/**
 * Internal dependencies
 */
const { log, formats } = require( './logger' );

/**
 * Utility to run a child script
 *
 * @param {string}  script Script to run.
 * @param {string=} cwd    Working directory.
 */
function runShellScript( script, cwd ) {
	childProcess.execSync( script, {
		cwd,
		env: {
			NO_CHECKS: 'true',
			PATH: process.env.PATH,
			HOME: process.env.HOME,
		},
		stdio: [ 'inherit', 'ignore', 'inherit' ],
	} );
}

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
 * Common logic wrapping a step in the process.
 *
 * @param {string}   name         Step name.
 * @param {string}   abortMessage Abort message.
 * @param {Function} handler      Step logic.
 */
async function runStep( name, abortMessage, handler ) {
	try {
		await handler();
	} catch ( exception ) {
		log(
			formats.error(
				'The following error happened during the "' +
					formats.warning( name ) +
					'" step:'
			) + '\n\n',
			exception,
			formats.error( '\n\n' + abortMessage )
		);

		process.exit( 1 );
	}
}

/**
 * Asks the user for a confirmation to continue or abort otherwise.
 *
 * @param {string}  message      Confirmation message.
 * @param {boolean} isDefault    Default reply.
 * @param {string}  abortMessage Abort message.
 */
async function askForConfirmation(
	message,
	isDefault = true,
	abortMessage = 'Aborting.'
) {
	const { isReady } = await inquirer.prompt( [
		{
			type: 'confirm',
			name: 'isReady',
			default: isDefault,
			message,
		},
	] );

	if ( ! isReady ) {
		log( formats.error( '\n' + abortMessage ) );
		process.exit( 1 );
	}
}

/**
 * Generates a random temporary path in the OS's tmp dir.
 *
 * @return {string} Temporary Path.
 */
function getRandomTemporaryPath() {
	return path.join( os.tmpdir(), uuid() );
}

module.exports = {
	askForConfirmation,
	runStep,
	readJSONFile,
	runShellScript,
	getRandomTemporaryPath,
};
