/**
 * External dependencies
 */
// @ts-ignore
const { confirm } = require( '@inquirer/prompts' );
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
 * @typedef {NodeJS.ProcessEnv} Env
 *
 * @param {string}  script Script to run.
 * @param {string=} cwd    Working directory.
 * @param {Env=}    env    Additional environment variables to pass to the script.
 */
function runShellScript( script, cwd, env = {} ) {
	return new Promise( ( resolve, reject ) => {
		childProcess.exec(
			script,
			{
				cwd,
				env: {
					NO_CHECKS: 'true',
					PATH: process.env.PATH,
					HOME: process.env.HOME,
					USER: process.env.USER,
					...env,
				},
			},
			function ( error, stdout, stderr ) {
				if ( error ) {
					console.log( stdout ); // Sometimes the error message is thrown via stdout.
					console.log( stderr );
					reject( error );
				} else {
					resolve( true );
				}
			}
		);
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
	let isReady = false;
	try {
		isReady = await confirm( {
			default: isDefault,
			message,
		} );
	} catch ( error ) {
		if ( error instanceof Error && error.name === 'ExitPromptError' ) {
			console.log( 'Cancelled.' );
			process.exit( 1 );
		}
		throw error;
	}

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

/**
 * Scans the given directory and returns an array of file paths.
 *
 * @param {string} dir The path to the directory to scan.
 *
 * @return {string[]} An array of file paths.
 */
function getFilesFromDir( dir ) {
	if ( ! fs.existsSync( dir ) ) {
		console.log( 'Directory does not exist: ', dir );
		return [];
	}

	return fs
		.readdirSync( dir, { withFileTypes: true } )
		.filter( ( dirent ) => dirent.isFile() )
		.map( ( dirent ) => path.join( dir, dirent.name ) );
}

module.exports = {
	askForConfirmation,
	runStep,
	readJSONFile,
	runShellScript,
	getRandomTemporaryPath,
	getFilesFromDir,
};
