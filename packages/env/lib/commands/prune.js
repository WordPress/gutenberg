'use strict';
/**
 * External dependencies
 */
const fs = require( 'fs' ).promises;
const path = require( 'path' );
const { confirm } = require( '@inquirer/prompts' );
const { v2: dockerCompose } = require( 'docker-compose' );
const { rimraf } = require( 'rimraf' );

/**
 * Internal dependencies
 */
const getCacheDirectory = require( '../config/get-cache-directory' );
const { getCacheFile } = require( '../cache' );

/**
 * Scan the wp-env cache directory, identify orphaned environment directories
 * (those whose original project path no longer exists on disk), tear down any
 * associated runtime resources, and delete the stale cache directories.
 *
 * An environment is considered orphaned when its recorded `configPath` refers
 * to a directory that no longer exists.  Environments whose `configPath` has
 * not yet been written (e.g. initialised before this feature was added and not
 * yet re-started) are skipped with an informational note.
 *
 * @param {Object}  options
 * @param {Object}  options.spinner A CLI spinner which indicates progress.
 * @param {boolean} options.force   If true, skips the confirmation prompt.
 * @param {boolean} options.debug   True if debug mode is enabled.
 */
module.exports = async function prune( { spinner, force, debug } ) {
	const cacheDirectory = await getCacheDirectory();

	// Discover all subdirectories of the cache root.
	let entries;
	try {
		entries = await fs.readdir( cacheDirectory, { withFileTypes: true } );
	} catch {
		spinner.text =
			'Could not find the wp-env cache directory. Nothing to prune.';
		return;
	}

	const subdirs = entries
		.filter( ( entry ) => entry.isDirectory() )
		.map( ( entry ) => path.join( cacheDirectory, entry.name ) );

	if ( subdirs.length === 0 ) {
		spinner.text = 'No wp-env environments found. Nothing to prune.';
		return;
	}

	spinner.text = `Scanning ${ subdirs.length } environment(s)…`;

	const orphaned = [];
	const untracked = [];

	for ( const workDir of subdirs ) {
		const cache = await getCacheFile( { workDirectoryPath: workDir } );

		const configPath = cache.configPath;
		const runtime = cache.runtime;

		// Without a recorded configPath we cannot determine orphan status.
		if ( ! configPath ) {
			untracked.push( workDir );
			continue;
		}

		// Check whether the original project directory still exists.
		let projectExists = true;
		try {
			await fs.stat( configPath );
		} catch {
			projectExists = false;
		}

		if ( ! projectExists ) {
			orphaned.push( {
				workDir,
				runtime,
				configPath,
			} );
		}
	}

	if ( untracked.length > 0 ) {
		spinner.info(
			`${ untracked.length } environment(s) have no recorded project path and were skipped.\n` +
				'Run `wp-env start` from the corresponding project director(ies) to register them,\n' +
				'then run `wp-env prune` again.\n' +
				untracked
					.map( ( d ) => `  • ${ path.basename( d ) }` )
					.join( '\n' )
		);
	}

	if ( orphaned.length === 0 ) {
		spinner.text =
			'No orphaned wp-env environments found. Nothing to prune.';
		return;
	}

	// Report what will be removed.
	spinner.info(
		`Found ${ orphaned.length } orphaned environment(s):\n` +
			orphaned
				.map(
					( { workDir, configPath, runtime } ) =>
						`  • ${ path.basename( workDir ) }\n` +
						`      project path : ${ configPath }\n` +
						`      runtime      : ${ runtime ?? 'unknown' }`
				)
				.join( '\n' )
	);

	const hasDocker = orphaned.some( ( { runtime } ) => runtime === 'docker' );
	spinner.info(
		'The following will be removed for each orphaned environment:\n' +
			( hasDocker
				? '  • Docker containers, volumes, networks, and images\n'
				: '' ) +
			'  • The wp-env cache directory for that environment'
	);

	let yesDelete = force;
	if ( ! force ) {
		try {
			yesDelete = await confirm( {
				message: 'Are you sure you want to continue?',
				default: false,
			} );
		} catch ( error ) {
			if ( error.name === 'ExitPromptError' ) {
				console.log( 'Cancelled.' );
				process.exit( 1 );
			}
			throw error;
		}
	}

	spinner.start();

	if ( ! yesDelete ) {
		spinner.text = 'Cancelled.';
		return;
	}

	let removed = 0;

	for ( const { workDir, runtime } of orphaned ) {
		spinner.text = `Removing ${ path.basename( workDir ) }…`;

		if ( runtime === 'docker' ) {
			const dockerComposeConfigPath = path.join(
				workDir,
				'docker-compose.yml'
			);

			try {
				await fs.stat( dockerComposeConfigPath );

				spinner.text = `Removing Docker resources for ${ path.basename(
					workDir
				) }…`;

				await dockerCompose.down( {
					config: dockerComposeConfigPath,
					commandOptions: [
						'--volumes',
						'--remove-orphans',
						'--rmi',
						'all',
					],
					log: debug,
				} );

				// Give Docker time to finish releasing image locks before we
				// try to remove the directory that contains the compose file.
				await new Promise( ( resolve ) =>
					setTimeout( resolve, 10000 )
				);
			} catch {
				// docker-compose.yml may not exist or Docker may be unavailable;
				// proceed to remove the local cache directory regardless.
			}
		}

		await rimraf( workDir );
		removed++;
	}

	spinner.text = `Removed ${ removed } orphaned environment(s).`;
};
