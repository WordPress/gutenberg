'use strict';
/**
 * External dependencies
 */
const fs = require( 'fs' ).promises;
const path = require( 'path' );
const { confirm } = require( '@inquirer/prompts' );
const { rimraf } = require( 'rimraf' );

/**
 * Internal dependencies
 */
const { loadConfig } = require( '../config' );
const { executeLifecycleScript } = require( '../execute-lifecycle-script' );
const { getRuntime, getSavedRuntime, saveRuntime } = require( '../runtime' );

/**
 * @typedef {import('../config').WPConfig} WPConfig
 */

/**
 * Starts the development server.
 *
 * @param {Object}  options
 * @param {Object}  options.spinner A CLI spinner which indicates progress.
 * @param {boolean} options.update  If true, update sources.
 * @param {string}  options.xdebug  The Xdebug mode to set.
 * @param {string}  options.spx     The SPX mode to set.
 * @param {boolean} options.scripts Indicates whether or not lifecycle scripts should be executed.
 * @param {boolean} options.debug   True if debug mode is enabled.
 * @param {string}  options.runtime The runtime to use ('docker' or 'playground').
 */
module.exports = async function start( {
	spinner,
	update,
	xdebug,
	spx,
	scripts,
	debug,
	runtime: runtimeName = 'docker',
} ) {
	spinner.text = 'Reading configuration.';

	const runtime = getRuntime( runtimeName );

	// Check for legacy Docker installs (Docker-specific UI concern)
	if ( runtimeName === 'docker' ) {
		await checkForLegacyInstall( spinner );
	}

	const config = await loadConfig( path.resolve( '.' ) );
	config.debug = debug;

	// Check if switching runtimes and prompt user to destroy old environment first.
	const savedRuntime = await getSavedRuntime( config.workDirectoryPath );
	if ( savedRuntime && savedRuntime !== runtimeName ) {
		spinner.stop();
		let shouldDestroy = false;
		try {
			shouldDestroy = await confirm( {
				message: `Environment was previously started with '${ savedRuntime }' runtime. Destroy it and start with '${ runtimeName }'?`,
				default: true,
			} );
		} catch ( error ) {
			if ( error.name === 'ExitPromptError' ) {
				console.log( 'Cancelled.' );
				process.exit( 1 );
			}
			throw error;
		}

		if ( ! shouldDestroy ) {
			spinner.fail(
				`Aborted. Run 'wp-env destroy' manually or start with '--runtime=${ savedRuntime }'.`
			);
			process.exit( 1 );
		}

		// User confirmed - destroy old runtime first.
		spinner.start();
		spinner.text = `Destroying previous ${ savedRuntime } environment.`;
		const oldRuntime = getRuntime( savedRuntime );
		await oldRuntime.destroy( config, { spinner } );
	}

	if ( ! config.detectedLocalConfig ) {
		const { configDirectoryPath } = config;
		spinner.warn(
			`Warning: could not find a .wp-env.json configuration file and could not determine if '${ configDirectoryPath }' is a WordPress installation, a plugin, or a theme.`
		);
		spinner.start();
	}

	// Display Playground limitations info
	if ( runtimeName === 'playground' ) {
		spinner.info(
			'Note: Playground runtime does not support a separate tests environment. Only the development environment will be started.\n'
		);
		spinner.start();
	}

	let result;
	try {
		result = await runtime.start( config, {
			spinner,
			update,
			xdebug,
			spx,
			debug,
		} );

		// Save the runtime type after successful start.
		await saveRuntime( runtimeName, config.workDirectoryPath );
	} catch ( error ) {
		// Attempt to stop any partially-started environment so that
		// processes do not linger after a failed start.
		try {
			await runtime.stop( config, { spinner } );
		} catch {
			// Ignore cleanup errors.
		}
		throw error;
	}

	if ( scripts ) {
		await executeLifecycleScript( 'afterStart', config, spinner );
	}

	spinner.prefixText = result.message;
	spinner.prefixText += '\n\n';
	spinner.text = 'Done!';
};

/**
 * Checks for legacy installs and provides
 * the user the option to delete them.
 *
 * @param {Object} spinner A CLI spinner which indicates progress.
 */
async function checkForLegacyInstall( spinner ) {
	const basename = path.basename( process.cwd() );
	const installs = [
		`../${ basename }-wordpress`,
		`../${ basename }-tests-wordpress`,
	];
	await Promise.all(
		installs.map( ( install ) =>
			fs
				.access( install )
				.catch( () =>
					installs.splice( installs.indexOf( install ), 1 )
				)
		)
	);
	if ( ! installs.length ) {
		return;
	}

	spinner.info(
		`It appears that you have used a previous version of this tool where installs were kept in ${ installs.join(
			' and '
		) }. Installs are now in your home folder.\n`
	);
	let yesDelete = false;
	try {
		yesDelete = confirm( {
			message:
				'Do you wish to delete these old installs to reclaim disk space?',
			default: true,
		} );
	} catch ( error ) {
		if ( error.name === 'ExitPromptError' ) {
			console.log( 'Cancelled.' );
			process.exit( 1 );
		}
		throw error;
	}

	if ( yesDelete ) {
		await Promise.all( installs.map( ( install ) => rimraf( install ) ) );
		spinner.info( 'Old installs deleted successfully.' );
	}
	spinner.start();
}
