/**
 * External dependencies
 */
// @ts-ignore
const inquirer = require( 'inquirer' );
const fs = require( 'fs' );
const { spawn } = require( 'child_process' );
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
 * @param {string}   command
 * @param {string[]} args
 * @param {string=}  cwd     Current working directory.
 * @param {Env=}     env     Environment variables.
 * @param {boolean=} shell   Use shell.
 */
async function runShellScript( command, args, cwd, env = {}, shell = false ) {
	if ( ! command ) {
		throw new Error( 'No command provided' );
	}

	return new Promise( ( resolve, reject ) => {
		const child = spawn( command, args, {
			cwd,
			env: {
				NO_CHECKS: 'true',
				PATH: process.env.PATH,
				HOME: process.env.HOME,
				USER: process.env.USER,
				...env,
			},
			shell: /cp|bash/.test( command ) ? true : shell,
			stdio: 'inherit',
		} );

		let stdout = '';
		let stderr = '';

		if ( child.stdout ) {
			child.stdout.on( 'data', ( data ) => {
				const dataStr = data.toString();
				stdout += dataStr;
				process.stdout.write( dataStr ); // Print to console in real-time
			} );
		}

		if ( child.stderr ) {
			child.stderr.on( 'data', ( data ) => {
				const dataStr = data.toString();
				stderr += dataStr;
				process.stderr.write( dataStr ); // Print to console in real-time
			} );
		}

		child.on( 'close', ( code ) => {
			if ( code === 0 ) {
				resolve( { stdout, stderr } );
			} else {
				reject(
					new Error(
						`Process exited with code ${ code }: ${ stderr }`
					)
				);
			}
		} );

		child.on( 'error', ( error ) => {
			reject( error );
		} );
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
