'use strict';

/**
 * External dependencies
 */
const fs = require( 'fs' ).promises;
const http = require( 'http' );
const path = require( 'path' );
const spawn = require( 'cross-spawn' );

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
			xdebug: true, // Supported via --xdebug flag
			spx: false, // Not supported in WebAssembly
			phpMyAdmin: false, // Supported on playground.wordpress.net but not in CLI yet
			multisite: true, // Supported via Blueprint
			customPhpVersion: true, // Supported via --php flag
			persistentDatabase: false, // Could be supported via mounts (not yet implemented)
			wpCli: true, // Limited support (not extensively tested)
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
	 * @param {string}  options.xdebug  The Xdebug mode to set.
	 */
	async start( config, { spinner, debug, xdebug } ) {
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

		if ( xdebug ) {
			cliArgs.push( '--xdebug' );
		}

		spinner.text = `Starting Playground on port ${ port }...`;

		const siteUrl = `http://localhost:${ port }`;
		const logFile = path.join( config.workDirectoryPath, 'playground.log' );

		// Use cross-spawn with detached mode for cross-platform support
		// Create write stream for log file
		const logFileStream = await fs.open( logFile, 'w' );

		return new Promise( ( resolve, reject ) => {
			const child = spawn( 'npx', [ '@wp-playground/cli', ...cliArgs ], {
				detached: true,
				stdio: [ 'ignore', logFileStream.fd, logFileStream.fd ],
				env: { ...process.env, FORCE_COLOR: '0' },
			} );

			// Store child process reference
			this.serverProcess = child;
			this.serverPort = port;

			// Allow parent to exit independently
			child.unref();

			child.on( 'error', ( error ) => {
				logFileStream.close();
				reject(
					new Error(
						`Failed to start Playground: ${ error.message }`
					)
				);
			} );

			// Wait for server to be ready
			this._waitForServer( port, 120000 )
				.then( async () => {
					spinner.text = `WordPress Playground started at ${ siteUrl }`;

					const message =
						'WordPress development site started at ' + siteUrl;

					resolve( {
						message,
						siteUrl,
					} );
				} )
				.catch( async ( error ) => {
					// Try to kill the process if it started but server never responded
					if ( this.serverProcess ) {
						this.serverProcess.kill( 'SIGKILL' );
						this.serverProcess = null;
					}

					// Read log file for error details
					let logContent = '';
					try {
						logContent = await fs.readFile( logFile, 'utf8' );
					} catch {
						// Ignore
					}

					await logFileStream.close();

					reject(
						new Error(
							`${ error.message }\n\nPlayground log:\n${
								logContent || '(no log output)'
							}`
						)
					);
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
			// Try graceful shutdown first
			this.serverProcess.kill( 'SIGTERM' );

			// Give it a moment for graceful shutdown
			await new Promise( ( r ) => setTimeout( r, 1000 ) );

			// Force kill if still running
			if ( ! this.serverProcess.killed ) {
				this.serverProcess.kill( 'SIGKILL' );
			}

			this.serverProcess = null;
			this.serverPort = null;
		}

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
}

module.exports = PlaygroundRuntime;
