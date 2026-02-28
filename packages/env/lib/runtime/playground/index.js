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
const { downloadSource } = require( '../../download-sources' );

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
			phpMyAdmin: true, // Supported via --phpmyadmin CLI flag
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
	 * Get the warning message for cleanup confirmation.
	 *
	 * @return {string} Warning message.
	 */
	getCleanupWarningMessage() {
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

		// Determine port early so we can check if it's in use.
		const port = envConfig.port || 8888;

		// Ensure any previous Playground instance is fully stopped before
		// starting a new one. Without this, a stale process from a previous
		// run may still hold the port, causing _waitForServer to connect to
		// the old (potentially corrupted) instance instead of the new one.
		await this.stop( config, { spinner } );

		// Additionally, verify the port is actually free. A previous run's
		// multi-worker child processes may survive the main process kill.
		await this._waitForPortRelease( port, 5000 );

		spinner.text = 'Starting WordPress Playground.';

		// Download remote sources (git/zip) if needed
		const sources = [];
		const addedSources = {};
		const addSource = ( source ) => {
			if (
				source &&
				( source.type === 'git' || source.type === 'zip' ) &&
				! addedSources[ source.url ]
			) {
				sources.push( source );
				addedSources[ source.url ] = true;
			}
		};

		// Collect all sources that need downloading
		envConfig.pluginSources.forEach( addSource );
		envConfig.themeSources.forEach( addSource );
		Object.values( envConfig.mappings ).forEach( addSource );
		addSource( envConfig.coreSource );

		// Download sources if any exist
		if ( sources.length > 0 ) {
			spinner.text = 'Downloading sources.';

			await Promise.all(
				sources.map( ( source ) =>
					downloadSource( source, {
						onProgress: () => {}, // Progress tracking could be added
						spinner,
						debug,
					} )
				)
			);
		}

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

		const phpVersion = envConfig.phpVersion || '8.2';
		const siteUrl = `http://localhost:${ port }`;

		// Build command arguments for direct execution.
		// Note: --experimental-multi-worker is intentionally omitted.
		// Multi-worker mode spawns separate PHP workers that may process
		// REST API requests before the blueprint has finished running on
		// the main worker, causing "Internal Server Error" responses.
		// Single-worker mode ensures blueprint completion before serving.
		const cliArgs = [
			'server',
			'--port',
			String( port ),
			'--site-url',
			siteUrl,
			'--php',
			phpVersion,
			'--blueprint',
			blueprintPath,
			'--login',
			...mountArgs,
		];

		// Always use debug verbosity to aid troubleshooting.
		// TODO: Remove this once the Playground runtime is stable.
		cliArgs.push( '--verbosity', 'debug' );

		if ( envConfig.phpmyadmin ) {
			cliArgs.push( '--phpmyadmin' );
		}

		if ( xdebug ) {
			cliArgs.push( '--xdebug' );
		}

		spinner.text = `Starting Playground on port ${ port }...`;

		const logFile = path.join( config.workDirectoryPath, 'playground.log' );
		const pidFile = path.join( config.workDirectoryPath, 'playground.pid' );

		// Use cross-spawn with detached mode for cross-platform support
		// Create write stream for log file
		const logFileStream = await fs.open( logFile, 'w' );

		// Resolve the CLI binary directly so that it is found even when
		// the package is nested inside workspace node_modules (where npx
		// cannot discover it).
		const cliPackageJson = require.resolve(
			'@wp-playground/cli/package.json'
		);
		const cliEntryPoint = path.join(
			path.dirname( cliPackageJson ),
			'wp-playground.js'
		);

		return new Promise( ( resolve, reject ) => {
			const child = spawn(
				process.execPath,
				[ cliEntryPoint, ...cliArgs ],
				{
					detached: true,
					stdio: [ 'ignore', logFileStream.fd, logFileStream.fd ],
					env: { ...process.env, FORCE_COLOR: '0' },
				}
			);

			// Store child process reference
			this.serverProcess = child;
			this.serverPort = port;

			// Save PID to file immediately so stop command can find the
			// process even if startup fails before the server is ready.
			fs.writeFile( pidFile, String( child.pid ) ).catch( () => {} );

			// Allow parent to exit independently
			child.unref();

			// Track whether the process has exited so cleanup knows
			// whether it still needs to kill it.
			let processExited = false;

			// If the process exits before the server is ready (e.g. blueprint
			// validation error), reject immediately instead of waiting for
			// the full 120-second timeout.
			const earlyExitPromise = new Promise( ( _, rejectEarly ) => {
				child.on( 'exit', ( code, signal ) => {
					processExited = true;
					const reason =
						code !== null
							? `with code ${ code }`
							: `from signal ${ signal }`;
					rejectEarly(
						new Error(
							`Playground process exited unexpectedly ${ reason }.`
						)
					);
				} );
			} );

			child.on( 'error', ( error ) => {
				logFileStream.close();
				reject(
					new Error(
						`Failed to start Playground: ${ error.message }`
					)
				);
			} );

			// Race: wait for server to respond vs process early exit.
			Promise.race( [
				this._waitForServer( port, 120000 ),
				earlyExitPromise,
			] )
				.then( async () => {
					spinner.text = `WordPress Playground started at ${ siteUrl }`;

					const phpmyadminUrl = envConfig.phpmyadmin
						? `${ siteUrl }/phpmyadmin`
						: null;

					const message = [
						'WordPress development site started at ' + siteUrl,
						phpmyadminUrl &&
							`phpMyAdmin started at ${ phpmyadminUrl }`,
					]
						.filter( Boolean )
						.join( '\n' );

					resolve( {
						message,
						siteUrl,
					} );
				} )
				.catch( async ( error ) => {
					// Kill the process if it is still running.
					if ( ! processExited && this.serverProcess ) {
						this.serverProcess.kill( 'SIGKILL' );
						this.serverProcess = null;
					}

					// Clean up PID file
					try {
						await fs.unlink( pidFile );
					} catch {
						// Ignore if file doesn't exist
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

		const pidFile = path.join( config.workDirectoryPath, 'playground.pid' );

		// Try to read PID from file if process reference not available
		let pid = this.serverProcess?.pid;
		if ( ! pid ) {
			try {
				const pidContent = await fs.readFile( pidFile, 'utf8' );
				pid = parseInt( pidContent.trim(), 10 );
			} catch ( error ) {
				// PID file doesn't exist or can't be read
				spinner.text = 'Stopped WordPress Playground.';
				return;
			}
		}

		if ( pid ) {
			try {
				// Kill the entire process group (negative PID)
				// This ensures both the npm process and child node process are killed
				process.kill( -pid, 'SIGTERM' );

				// Give it a moment for graceful shutdown
				await new Promise( ( r ) => setTimeout( r, 1000 ) );

				// Check if still running and force kill if needed
				try {
					process.kill( -pid, 0 ); // Check if process group exists
					process.kill( -pid, 'SIGKILL' ); // Force kill entire group
					// Wait for the process to fully terminate and release the port
					await new Promise( ( r ) => setTimeout( r, 500 ) );
				} catch {
					// Process group already terminated
				}
			} catch ( error ) {
				// Process group doesn't exist or already terminated
			}

			// Clean up PID file
			try {
				await fs.unlink( pidFile );
			} catch {
				// Ignore if file doesn't exist
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
	 * Cleanup the WordPress Playground environment.
	 *
	 * For Playground, cleanup is the same as destroy since there are no
	 * shared resources like Docker images to preserve.
	 *
	 * @param {Object} config          The wp-env config object.
	 * @param {Object} options         Cleanup options.
	 * @param {Object} options.spinner A CLI spinner which indicates progress.
	 */
	async cleanup( config, { spinner } ) {
		await this.stop( config, { spinner } );

		spinner.text = 'Removing local files.';
		await rimraf( config.workDirectoryPath );

		spinner.text = 'Cleaned up WordPress Playground environment.';
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
	 * Reset the WordPress database.
	 *
	 * @param {Object}  config          The wp-env config object.
	 * @param {Object}  options         Reset options.
	 * @param {Object}  options.spinner A CLI spinner which indicates progress.
	 * @param {boolean} options.debug   True if debug mode is enabled.
	 */
	async clean( config, { spinner, debug } ) {
		spinner.text = 'Resetting WordPress Playground environment.';

		// For Playground, we restart the server to reset the database
		await this.stop( config, { spinner } );
		await this.start( config, { spinner, debug } );

		spinner.text = 'Reset WordPress Playground environment.';
	}

	/**
	 * Get the status of the Playground environment.
	 *
	 * @param {Object} config          The wp-env config object.
	 * @param {Object} options         Status options.
	 * @param {Object} options.spinner A CLI spinner which indicates progress.
	 * @return {Promise<Object>} Status object with environment information.
	 */
	async getStatus( config, { spinner } ) {
		spinner.text = 'Getting environment status.';

		const envConfig = config.env.development;
		const port = envConfig.port || 8888;
		const pidFile = path.join( config.workDirectoryPath, 'playground.pid' );

		// Check if server is running.
		let isRunning = false;

		try {
			const pidContent = await fs.readFile( pidFile, 'utf8' );
			const pid = parseInt( pidContent.trim(), 10 );

			// Check if process is still alive.
			process.kill( pid, 0 );

			// Check if server is responding.
			await this._checkServer( port );
			isRunning = true;
		} catch {
			// Process not running or server not responding.
		}

		return {
			status: isRunning ? 'running' : 'stopped',
			runtime: 'playground',
			urls: {
				development: isRunning ? `http://localhost:${ port }` : null,
				phpmyadmin:
					isRunning && envConfig.phpmyadmin
						? `http://localhost:${ port }/phpmyadmin`
						: null,
			},
			ports: {
				development: port,
			},
			config: {
				multisite: envConfig.multisite,
				xdebug: 'off',
			},
			configPath: config.configDirectoryPath,
			installPath: config.workDirectoryPath,
		};
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
	 * Wait for the server to be ready and stable.
	 *
	 * After the server first responds, we run a stabilization phase that
	 * verifies the REST API answers correctly several times in a row with
	 * a gap between each check.  This guards against a race condition
	 * where the HTTP server begins accepting requests before WordPress
	 * (and its plugins) are fully initialized, causing early REST calls
	 * to return "Internal Server Error".
	 *
	 * @param {number} port    Port to check.
	 * @param {number} timeout Timeout in milliseconds.
	 * @return {Promise<void>}
	 */
	async _waitForServer( port, timeout = 120000 ) {
		const start = Date.now();
		const STABILIZATION_CHECKS = 3;
		const STABILIZATION_GAP_MS = 1000;

		// Phase 1 — wait for the very first successful response.
		while ( Date.now() - start < timeout ) {
			try {
				await this._checkServer( port );
				break; // First response received — enter stabilization.
			} catch {
				await new Promise( ( r ) => setTimeout( r, 500 ) );
			}
		}

		if ( Date.now() - start >= timeout ) {
			throw new Error(
				`Playground server did not start within ${
					timeout / 1000
				} seconds.`
			);
		}

		// Phase 2 — stabilization: require several consecutive successes
		// with a pause between each to confirm the server is fully ready.
		let consecutiveOk = 0;
		while (
			consecutiveOk < STABILIZATION_CHECKS &&
			Date.now() - start < timeout
		) {
			await new Promise( ( r ) => setTimeout( r, STABILIZATION_GAP_MS ) );
			try {
				await this._checkServer( port );
				consecutiveOk++;
			} catch {
				// A failed check during stabilization resets the counter.
				consecutiveOk = 0;
			}
		}

		if ( consecutiveOk < STABILIZATION_CHECKS ) {
			throw new Error(
				`Playground server started but failed to stabilize within ${
					timeout / 1000
				} seconds.`
			);
		}
	}

	/**
	 * Check if server is responding and the REST API is functional.
	 *
	 * Hitting the REST API endpoint instead of the homepage ensures that
	 * WordPress is fully initialized (database tables created, plugins
	 * loaded, rewrite rules flushed). The homepage may return 200 before
	 * the REST API is ready, causing subsequent REST calls to fail with
	 * "Internal Server Error".
	 *
	 * We additionally verify the response is valid JSON, which proves
	 * the PHP WASM worker processed the request end-to-end (as opposed
	 * to the HTTP layer returning a generic error page).
	 *
	 * @param {number} port Port to check.
	 * @return {Promise<void>}
	 */
	_checkServer( port ) {
		return new Promise( ( resolve, reject ) => {
			// Use ?rest_route= form which works regardless of permalink settings.
			const req = http.get(
				`http://localhost:${ port }/?rest_route=/wp/v2/types`,
				( res ) => {
					let body = '';
					res.on( 'data', ( chunk ) => {
						body += chunk;
					} );
					res.on( 'end', () => {
						if ( res.statusCode < 200 || res.statusCode >= 400 ) {
							reject(
								new Error( `Status: ${ res.statusCode }` )
							);
							return;
						}
						// Verify the response is valid JSON — a text/HTML
						// error page would indicate the PHP worker crashed.
						try {
							JSON.parse( body );
						} catch {
							reject( new Error( 'Response is not valid JSON' ) );
							return;
						}
						resolve();
					} );
				}
			);
			req.on( 'error', reject );
			req.setTimeout( 5000, () => {
				req.destroy();
				reject( new Error( 'Timeout' ) );
			} );
		} );
	}

	/**
	 * Wait until nothing is listening on the given port.
	 *
	 * This guards against stale Playground processes (e.g. multi-worker
	 * children) that survive a PID-based kill.  If the port is still
	 * occupied after the timeout, we proceed anyway — the new process
	 * will fail to bind and _waitForServer will surface the error.
	 *
	 * @param {number} port    Port to wait for.
	 * @param {number} timeout Max wait in milliseconds.
	 * @return {Promise<void>}
	 */
	async _waitForPortRelease( port, timeout = 5000 ) {
		const start = Date.now();

		while ( Date.now() - start < timeout ) {
			const inUse = await new Promise( ( resolve ) => {
				const req = http.get( `http://localhost:${ port }`, ( res ) => {
					// Drain the response to free the socket.
					res.resume();
					resolve( true );
				} );
				req.on( 'error', () => resolve( false ) );
				req.setTimeout( 500, () => {
					req.destroy();
					resolve( false );
				} );
			} );

			if ( ! inUse ) {
				return;
			}

			await new Promise( ( r ) => setTimeout( r, 250 ) );
		}
	}
}

module.exports = PlaygroundRuntime;
