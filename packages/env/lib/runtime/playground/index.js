'use strict';

/**
 * External dependencies
 */
const { spawn } = require( 'child_process' );
const path = require( 'path' );
const fs = require( 'fs' ).promises;
const http = require( 'http' );

/**
 * Promisified dependencies
 */
const { rimraf } = require( 'rimraf' );

/**
 * Internal dependencies
 */
const { buildBlueprint, getMountArgs } = require( './blueprint-builder' );
const { UnsupportedCommandError } = require( '../errors' );

/**
 * Playground runtime implementation for wp-env.
 */
class PlaygroundRuntime {
	constructor() {
		this.serverProcess = null;
		this.serverPort = null;
	}

	/**
	 * Get the name of this runtime.
	 *
	 * @return {string} Runtime name.
	 */
	getName() {
		return 'playground';
	}

	/**
	 * Get supported features for this runtime.
	 *
	 * @return {Object} Feature flags.
	 */
	getFeatures() {
		return {
			testsEnvironment: false, // Single environment only
			xdebug: false, // Not supported in WebAssembly
			spx: false, // Not supported in WebAssembly
			phpMyAdmin: false, // No MySQL
			multisite: true, // Supported via Blueprint
			customPhpVersion: true, // Supported via --php flag
			persistentDatabase: false, // SQLite resets
			wpCli: true, // Limited support via Playground
		};
	}

	/**
	 * Check if Playground CLI is available.
	 *
	 * @return {Promise<boolean>} True if Playground CLI is available.
	 */
	async isAvailable() {
		// npx will fetch it if not installed locally
		return true;
	}

	/**
	 * Get the warning message for destroy confirmation.
	 *
	 * @return {string} Warning message.
	 */
	getDestroyWarningMessage() {
		return 'WARNING! This will remove the WordPress Playground environment and all local files.';
	}

	/**
	 * Start the WordPress Playground environment.
	 *
	 * @param {Object}  config          The wp-env config object.
	 * @param {Object}  options         Start options.
	 * @param {Object}  options.spinner A CLI spinner which indicates progress.
	 * @param {boolean} options.debug   True if debug mode is enabled.
	 */
	async start( config, { spinner, debug } ) {
		const envConfig = config.env.development;

		spinner.text = 'Starting WordPress Playground.';

		// Build and save blueprint
		const blueprint = buildBlueprint( config );
		const blueprintPath = path.join(
			config.workDirectoryPath,
			'playground-blueprint.json'
		);
		await fs.mkdir( config.workDirectoryPath, { recursive: true } );
		await fs.writeFile(
			blueprintPath,
			JSON.stringify( blueprint, null, 2 )
		);

		// Get mount arguments
		const mountArgs = getMountArgs( config );

		// Determine port
		const port = envConfig.port || 8888;
		const phpVersion = envConfig.phpVersion || '8.2';

		// Check if there's an existing server to stop
		await this._stopExistingServer( config.workDirectoryPath );

		// Build command arguments for direct execution
		const cliArgs = [
			'server',
			'--port',
			String( port ),
			'--php',
			phpVersion,
			'--blueprint',
			blueprintPath,
			'--login',
			'--experimental-multi-worker',
			...mountArgs,
		];

		if ( debug ) {
			cliArgs.push( '--verbosity', 'debug' );
		}

		spinner.text = `Starting Playground on port ${ port }...`;

		const siteUrl = `http://localhost:${ port }`;
		const logFile = path.join( config.workDirectoryPath, 'playground.log' );

		// Use nohup via shell to truly daemonize the process
		// This ensures the process survives after the parent exits
		const shellCommand = [
			'nohup',
			'npx',
			'@wp-playground/cli',
			...cliArgs.map( ( arg ) => `'${ arg.replace( /'/g, "'\\''" ) }'` ),
			'>',
			`'${ logFile }'`,
			'2>&1',
			'&',
			'echo $!',
		].join( ' ' );

		return new Promise( ( resolve, reject ) => {
			const shell = spawn( 'sh', [ '-c', shellCommand ], {
				stdio: [ 'ignore', 'pipe', 'pipe' ],
				env: { ...process.env, FORCE_COLOR: '0' },
			} );

			let pidOutput = '';
			let stderrOutput = '';

			shell.stdout.on( 'data', ( data ) => {
				pidOutput += data.toString();
			} );

			shell.stderr.on( 'data', ( data ) => {
				stderrOutput += data.toString();
				if ( debug ) {
					process.stderr.write( data );
				}
			} );

			shell.on( 'error', ( error ) => {
				reject(
					new Error(
						`Failed to start Playground: ${ error.message }`
					)
				);
			} );

			shell.on( 'close', async ( code ) => {
				if ( code !== 0 ) {
					reject(
						new Error(
							`Shell exited with code ${ code }: ${ stderrOutput }`
						)
					);
					return;
				}

				// Extract PID from output
				const pid = parseInt( pidOutput.trim(), 10 );
				if ( ! pid || isNaN( pid ) ) {
					reject(
						new Error(
							`Could not get PID from output: ${ pidOutput }`
						)
					);
					return;
				}

				// Save PID
				await this._savePid( config.workDirectoryPath, pid );

				// Wait for server to be ready
				try {
					await this._waitForServer( port, 120000 );
					spinner.text = `WordPress Playground started at ${ siteUrl }`;

					resolve( {
						siteUrl,
						testsSiteUrl: null,
						mySQLPort: null,
						testsMySQLPort: null,
						phpmyadminPort: null,
						testsPhpmyadminPort: null,
					} );
				} catch ( error ) {
					// Try to kill the process if it started but server never responded
					try {
						process.kill( pid );
					} catch {
						// Ignore
					}

					// Read log file for error details
					let logContent = '';
					try {
						logContent = await fs.readFile( logFile, 'utf8' );
					} catch {
						// Ignore
					}

					reject(
						new Error(
							`${ error.message }\n\nPlayground log:\n${
								logContent || '(no log output)'
							}`
						)
					);
				}
			} );
		} );
	}

	/**
	 * Stop the WordPress Playground environment.
	 *
	 * @param {Object} config          The wp-env config object.
	 * @param {Object} options         Stop options.
	 * @param {Object} options.spinner A CLI spinner which indicates progress.
	 */
	async stop( config, { spinner } ) {
		spinner.text = 'Stopping WordPress Playground.';

		if ( this.serverProcess ) {
			this.serverProcess.kill();
			this.serverProcess = null;
		}

		await this._stopExistingServer( config.workDirectoryPath );

		spinner.text = 'Stopped WordPress Playground.';
	}

	/**
	 * Destroy the WordPress Playground environment.
	 *
	 * @param {Object} config          The wp-env config object.
	 * @param {Object} options         Destroy options.
	 * @param {Object} options.spinner A CLI spinner which indicates progress.
	 */
	async destroy( config, { spinner } ) {
		await this.stop( config, { spinner } );

		spinner.text = 'Removing local files.';
		await rimraf( config.workDirectoryPath );

		spinner.text = 'Removed WordPress Playground environment.';
	}

	/**
	 * Run a command in the Playground environment.
	 *
	 * @param {Object}   config            The wp-env config object.
	 * @param {Object}   options           Run options.
	 * @param {string}   options.container The container to run the command in.
	 * @param {string[]} options.command   The command to run.
	 * @param {string}   options.envCwd    The working directory.
	 * @param {Object}   options.spinner   A CLI spinner which indicates progress.
	 * @param {boolean}  options.debug     True if debug mode is enabled.
	 */
	// eslint-disable-next-line no-unused-vars
	async run( config, { container, command, envCwd, spinner, debug } ) {
		throw new UnsupportedCommandError( 'run' );
	}

	/**
	 * Clean/reset the WordPress database.
	 *
	 * @param {Object}  config          The wp-env config object.
	 * @param {Object}  options         Clean options.
	 * @param {Object}  options.spinner A CLI spinner which indicates progress.
	 * @param {boolean} options.debug   True if debug mode is enabled.
	 */
	async clean( config, { spinner, debug } ) {
		spinner.text = 'Cleaning WordPress Playground environment.';

		// For Playground, we restart the server to reset the database
		await this.stop( config, { spinner } );
		await this.start( config, { spinner, debug } );

		spinner.text = 'Cleaned WordPress Playground environment.';
	}

	/**
	 * Show logs from the Playground environment.
	 *
	 * @param {Object}  config              The wp-env config object.
	 * @param {Object}  options             Logs options.
	 * @param {string}  options.environment The environment to show logs for.
	 * @param {boolean} options.watch       If true, follow along with log output.
	 * @param {Object}  options.spinner     A CLI spinner which indicates progress.
	 * @param {boolean} options.debug       True if debug mode is enabled.
	 */
	// eslint-disable-next-line no-unused-vars
	async logs( config, { environment, watch, spinner, debug } ) {
		throw new UnsupportedCommandError( 'logs' );
	}

	/**
	 * Wait for the server to be ready.
	 *
	 * @param {number} port    Port to check.
	 * @param {number} timeout Timeout in milliseconds.
	 * @return {Promise<void>}
	 */
	async _waitForServer( port, timeout = 30000 ) {
		const start = Date.now();

		while ( Date.now() - start < timeout ) {
			try {
				await this._checkServer( port );
				return;
			} catch {
				await new Promise( ( r ) => setTimeout( r, 500 ) );
			}
		}

		throw new Error(
			`Playground server did not start within ${
				timeout / 1000
			} seconds.`
		);
	}

	/**
	 * Check if server is responding.
	 *
	 * @param {number} port Port to check.
	 * @return {Promise<void>}
	 */
	_checkServer( port ) {
		return new Promise( ( resolve, reject ) => {
			const req = http.get( `http://localhost:${ port }`, ( res ) => {
				if ( res.statusCode >= 200 && res.statusCode < 400 ) {
					resolve();
				} else {
					reject( new Error( `Status: ${ res.statusCode }` ) );
				}
			} );
			req.on( 'error', reject );
			req.setTimeout( 1000, () => {
				req.destroy();
				reject( new Error( 'Timeout' ) );
			} );
		} );
	}

	/**
	 * Save server PID for later cleanup.
	 *
	 * @param {string} workDir Work directory path.
	 * @param {number} pid     Process ID.
	 */
	async _savePid( workDir, pid ) {
		const pidFile = path.join( workDir, 'playground.pid' );
		try {
			await fs.writeFile( pidFile, String( pid ) );
		} catch {
			// Ignore errors
		}
	}

	/**
	 * Stop any existing server from a previous run.
	 *
	 * @param {string} workDir Work directory path.
	 */
	async _stopExistingServer( workDir ) {
		const pidFile = path.join( workDir, 'playground.pid' );
		try {
			const pid = await fs.readFile( pidFile, 'utf8' );
			const pidNum = parseInt( pid.trim(), 10 );
			if ( pidNum ) {
				try {
					process.kill( pidNum );
				} catch {
					// Process may already be dead
				}
			}
			await fs.unlink( pidFile );
		} catch {
			// No PID file or already removed
		}
	}
}

module.exports = PlaygroundRuntime;
