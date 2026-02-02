'use strict';
/**
 * External dependencies
 */
const { spawn, execSync } = require( 'child_process' );
const path = require( 'path' );
const fs = require( 'fs' ).promises;

/**
 * Internal dependencies
 */
const { loadConfig } = require( '../config' );
const { detectRuntime, getRuntime } = require( '../runtime' );

/**
 * @typedef {import('../config').WPConfig} WPConfig
 */

/**
 * Path to store ngrok state for the current environment.
 *
 * @param {string} workDirectoryPath The wp-env work directory path.
 * @return {string} Path to ngrok state file.
 */
function getNgrokStatePath( workDirectoryPath ) {
	return path.join( workDirectoryPath, 'ngrok-state.json' );
}

/**
 * Check if ngrok is installed and available.
 *
 * @return {boolean} True if ngrok is available.
 */
function isNgrokInstalled() {
	try {
		execSync( 'ngrok version', { stdio: 'ignore' } );
		return true;
	} catch {
		return false;
	}
}

/**
 * Get the current ngrok state for this environment.
 *
 * @param {string} workDirectoryPath The wp-env work directory path.
 * @return {Promise<Object|null>} The ngrok state or null if not running.
 */
async function getNgrokState( workDirectoryPath ) {
	const statePath = getNgrokStatePath( workDirectoryPath );
	try {
		const data = await fs.readFile( statePath, 'utf8' );
		return JSON.parse( data );
	} catch {
		return null;
	}
}

/**
 * Save the ngrok state for this environment.
 *
 * @param {string} workDirectoryPath The wp-env work directory path.
 * @param {Object} state             The state to save.
 * @return {Promise<void>}
 */
async function saveNgrokState( workDirectoryPath, state ) {
	const statePath = getNgrokStatePath( workDirectoryPath );
	await fs.writeFile( statePath, JSON.stringify( state, null, 2 ) );
}

/**
 * Remove the ngrok state file.
 *
 * @param {string} workDirectoryPath The wp-env work directory path.
 * @return {Promise<void>}
 */
async function removeNgrokState( workDirectoryPath ) {
	const statePath = getNgrokStatePath( workDirectoryPath );
	try {
		await fs.unlink( statePath );
	} catch {
		// File may not exist, ignore.
	}
}

/**
 * Get the ngrok public URL from the local API.
 *
 * @param {number} maxRetries Maximum number of retries.
 * @param {number} delay      Delay between retries in ms.
 * @return {Promise<string>} The public URL.
 */
async function getNgrokPublicUrl( maxRetries = 30, delay = 1000 ) {
	for ( let i = 0; i < maxRetries; i++ ) {
		try {
			// ngrok exposes a local API at port 4040 by default
			const response = await fetch( 'http://127.0.0.1:4040/api/tunnels' );
			if ( response.ok ) {
				const data = await response.json();
				const httpsTunnel = data.tunnels.find(
					( tunnel ) =>
						tunnel.proto === 'https' &&
						tunnel.config.addr.includes( ':' )
				);
				if ( httpsTunnel ) {
					return httpsTunnel.public_url;
				}
				// Fall back to any tunnel
				if ( data.tunnels.length > 0 ) {
					const tunnel = data.tunnels.find(
						( t ) => t.proto === 'https'
					);
					return tunnel
						? tunnel.public_url
						: data.tunnels[ 0 ].public_url;
				}
			}
		} catch {
			// API not ready yet, retry.
		}
		await new Promise( ( resolve ) => setTimeout( resolve, delay ) );
	}
	throw new Error(
		'Could not retrieve ngrok public URL. Make sure ngrok is running and accessible.'
	);
}

/**
 * Update WordPress site URL using WP-CLI.
 *
 * @param {WPConfig} config  The wp-env config.
 * @param {string}   siteUrl The new site URL.
 * @param {boolean}  debug   Whether debug mode is enabled.
 * @return {Promise<void>}
 */
async function updateWordPressSiteUrl( config, siteUrl, debug ) {
	const { v2: dockerCompose } = require( 'docker-compose' );

	const options = {
		config: config.dockerComposeConfigPath,
		commandOptions: [ '--rm' ],
		log: debug,
	};

	// Update both WP_HOME and WP_SITEURL
	const commands = [
		`wp option update home "${ siteUrl }"`,
		`wp option update siteurl "${ siteUrl }"`,
	];

	for ( const command of commands ) {
		await dockerCompose.run( 'cli', command, options );
	}
}

/**
 * Start ngrok tunnel for the wp-env environment.
 *
 * @param {Object}  options
 * @param {Object}  options.spinner A CLI spinner which indicates progress.
 * @param {boolean} options.debug   True if debug mode is enabled.
 */
async function startNgrok( { spinner, debug } ) {
	spinner.text = 'Checking ngrok installation.';

	if ( ! isNgrokInstalled() ) {
		throw new Error(
			'ngrok is not installed. Please install it from https://ngrok.com/download'
		);
	}

	const config = await loadConfig( path.resolve( '.' ) );

	// Check if environment is initialized
	const runtimeName = detectRuntime( config.workDirectoryPath );
	if ( ! runtimeName ) {
		throw new Error(
			'The WordPress environment is not initialized. Run `wp-env start` first.'
		);
	}

	// Only Docker runtime is supported for ngrok
	if ( runtimeName !== 'docker' ) {
		throw new Error(
			'ngrok is only supported with the Docker runtime. The current runtime is: ' +
				runtimeName
		);
	}

	const runtime = getRuntime( runtimeName );

	// Check if environment is running
	spinner.text = 'Checking environment status.';
	const status = await runtime.getStatus( config, { spinner, debug } );

	if ( status.status !== 'running' ) {
		throw new Error(
			'The WordPress environment is not running. Run `wp-env start` first.'
		);
	}

	// Check if ngrok is already running for this environment
	const existingState = await getNgrokState( config.workDirectoryPath );
	if ( existingState && existingState.pid ) {
		try {
			// Check if the process is still running
			process.kill( existingState.pid, 0 );
			spinner.info(
				`ngrok is already running at ${ existingState.url }\n`
			);
			return `ngrok tunnel is already active at ${ existingState.url }`;
		} catch {
			// Process not running, clean up state
			await removeNgrokState( config.workDirectoryPath );
		}
	}

	// Store original URLs before modification
	const originalSiteUrl = config.env.development.config.WP_SITEURL;

	spinner.text = 'Starting ngrok tunnel.';

	const port = config.env.development.port;

	// Start ngrok in the background
	const ngrokProcess = spawn( 'ngrok', [ 'http', port.toString() ], {
		detached: true,
		stdio: 'ignore',
	} );

	// Allow the process to continue independently
	ngrokProcess.unref();

	// Wait for ngrok to start and get the public URL
	spinner.text = 'Waiting for ngrok tunnel to be ready.';
	let publicUrl;
	try {
		publicUrl = await getNgrokPublicUrl();
	} catch ( error ) {
		// Kill ngrok if we couldn't get the URL
		try {
			process.kill( ngrokProcess.pid, 'SIGTERM' );
		} catch {
			// Ignore kill errors
		}
		throw error;
	}

	// Save state
	await saveNgrokState( config.workDirectoryPath, {
		pid: ngrokProcess.pid,
		url: publicUrl,
		originalSiteUrl,
		startedAt: new Date().toISOString(),
	} );

	// Update WordPress URLs
	spinner.text = 'Updating WordPress site URL.';
	await updateWordPressSiteUrl( config, publicUrl, debug );

	return `ngrok tunnel started successfully!\n\n  Public URL: ${ publicUrl }\n  Local URL:  ${ originalSiteUrl }\n\n  WordPress admin: ${ publicUrl }/wp-admin/\n  Username: admin\n  Password: password\n\n  Run \`wp-env ngrok stop\` to stop the tunnel and restore the original URL.`;
}

/**
 * Stop ngrok tunnel for the wp-env environment.
 *
 * @param {Object}  options
 * @param {Object}  options.spinner A CLI spinner which indicates progress.
 * @param {boolean} options.debug   True if debug mode is enabled.
 */
async function stopNgrok( { spinner, debug } ) {
	spinner.text = 'Loading configuration.';

	const config = await loadConfig( path.resolve( '.' ) );

	// Check ngrok state
	const state = await getNgrokState( config.workDirectoryPath );
	if ( ! state ) {
		throw new Error( 'No ngrok tunnel is running for this environment.' );
	}

	spinner.text = 'Stopping ngrok tunnel.';

	// Try to kill the ngrok process
	try {
		process.kill( state.pid, 'SIGTERM' );
	} catch {
		// Process may have already exited
	}

	// Also try to kill any ngrok process via pkill as backup
	try {
		execSync( 'pkill -f "ngrok http"', { stdio: 'ignore' } );
	} catch {
		// Ignore errors
	}

	// Restore original WordPress URL
	if ( state.originalSiteUrl ) {
		spinner.text = 'Restoring original WordPress URL.';
		try {
			await updateWordPressSiteUrl( config, state.originalSiteUrl, debug );
		} catch ( error ) {
			spinner.warn(
				`Warning: Could not restore original URL. You may need to run: wp-env run cli 'wp option update home "${ state.originalSiteUrl }"'`
			);
		}
	}

	// Remove state file
	await removeNgrokState( config.workDirectoryPath );

	return `ngrok tunnel stopped. WordPress URL restored to ${ state.originalSiteUrl }`;
}

/**
 * Get ngrok status for the wp-env environment.
 *
 * @param {Object}  options
 * @param {Object}  options.spinner A CLI spinner which indicates progress.
 * @param {boolean} options.debug   True if debug mode is enabled.
 * @param {boolean} options.json    Output as JSON.
 */
async function statusNgrok( { spinner, debug, json } ) {
	spinner.text = 'Checking ngrok status.';

	const config = await loadConfig( path.resolve( '.' ) );

	const state = await getNgrokState( config.workDirectoryPath );

	let isRunning = false;
	if ( state && state.pid ) {
		try {
			process.kill( state.pid, 0 );
			isRunning = true;
		} catch {
			// Process not running
		}
	}

	const statusData = {
		running: isRunning,
		url: isRunning ? state.url : null,
		originalUrl: state?.originalSiteUrl || null,
		startedAt: isRunning ? state.startedAt : null,
	};

	spinner.stop();

	if ( json ) {
		console.log( JSON.stringify( statusData ) );
	} else if ( isRunning ) {
		console.log( `\nngrok tunnel is running` );
		console.log( `  URL: ${ state.url }` );
		console.log( `  Original URL: ${ state.originalSiteUrl }` );
		console.log( `  Started: ${ state.startedAt }` );
	} else {
		console.log( '\nNo ngrok tunnel is running for this environment.' );
	}

	return '';
}

/**
 * Main ngrok command handler.
 *
 * @param {Object}  options
 * @param {string}  options.action  The action to perform (start, stop, status).
 * @param {Object}  options.spinner A CLI spinner which indicates progress.
 * @param {boolean} options.debug   True if debug mode is enabled.
 * @param {boolean} options.json    Output as JSON (for status action).
 */
module.exports = async function ngrok( {
	action = 'start',
	spinner,
	debug,
	json,
} ) {
	switch ( action ) {
		case 'start':
			return await startNgrok( { spinner, debug } );
		case 'stop':
			return await stopNgrok( { spinner, debug } );
		case 'status':
			return await statusNgrok( { spinner, debug, json } );
		default:
			throw new Error(
				`Unknown ngrok action: ${ action }. Use 'start', 'stop', or 'status'.`
			);
	}
};

// Export individual functions for testing
module.exports.startNgrok = startNgrok;
module.exports.stopNgrok = stopNgrok;
module.exports.statusNgrok = statusNgrok;
module.exports.getNgrokState = getNgrokState;
