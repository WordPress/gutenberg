'use strict';
/**
 * External dependencies
 */
const util = require( 'util' );
const path = require( 'path' );
const fs = require( 'fs' ).promises;
const dockerCompose = require( 'docker-compose' );
const yaml = require( 'js-yaml' );

/**
 * Promisified dependencies
 */
const copyDir = util.promisify( require( 'copy-dir' ) );
const sleep = util.promisify( setTimeout );

/**
 * Internal dependencies
 */
const { ValidationError, readConfig } = require( './config' );
const downloadSource = require( './download-source' );
const buildDockerComposeConfig = require( './build-docker-compose-config' );

/**
 * @typedef {import('./config').Config} Config
 */

module.exports = {
	/**
	 * Starts the development server.
	 *
	 * @param {Object} options
	 * @param {Object} options.spinner A CLI spinner which indicates progress.
	 */
	async start( { spinner } ) {
		const config = await initConfig();

		spinner.text = 'Downloading WordPress.';

		const progresses = {};
		const getProgressSetter = ( id ) => ( progress ) => {
			progresses[ id ] = progress;
			spinner.text =
				'Downloading WordPress.\n' +
				Object.entries( progresses )
					.map(
						( [ key, value ] ) =>
							`  - ${ key }: ${ ( value * 100 ).toFixed(
								0
							) }/100%`
					)
					.join( '\n' );
		};

		await Promise.all( [
			// Preemptively start the database while we wait for sources to download.
			dockerCompose.upOne( 'mysql', {
				config: config.dockerComposeConfigPath,
			} ),

			( async () => {
				if ( config.coreSource ) {
					await downloadSource( config.coreSource, {
						onProgress: getProgressSetter( 'core' ),
					} );
					await copyCoreFiles(
						config.coreSource.path,
						config.coreSource.testsPath
					);
				}
			} )(),

			...config.pluginSources.map( ( source ) =>
				downloadSource( source, {
					onProgress: getProgressSetter( source.basename ),
				} )
			),

			...config.themeSources.map( ( source ) =>
				downloadSource( source, {
					onProgress: getProgressSetter( source.basename ),
				} )
			),
		] );

		spinner.text = 'Starting WordPress.';

		await dockerCompose.upMany( [ 'wordpress', 'tests-wordpress' ], {
			config: config.dockerComposeConfigPath,
		} );

		try {
			await checkDatabaseConnection( config );
		} catch ( error ) {
			// Wait 30 seconds for MySQL to accept connections.
			await retry( () => checkDatabaseConnection( config ), {
				times: 30,
				delay: 1000,
			} );

			// It takes 3-4 seconds for MySQL to be ready after it starts accepting connections.
			await sleep( 4000 );
		}

		// Retry WordPress installation in case MySQL *still* wasn't ready.
		await Promise.all( [
			retry( () => configureWordPress( 'development', config ), {
				times: 2,
			} ),
			retry( () => configureWordPress( 'tests', config ), { times: 2 } ),
		] );

		spinner.text = 'WordPress started.';
	},

	/**
	 * Stops the development server.
	 *
	 * @param {Object} options
	 * @param {Object} options.spinner A CLI spinner which indicates progress.
	 */
	async stop( { spinner } ) {
		const { dockerComposeConfigPath } = await initConfig();

		spinner.text = 'Stopping WordPress.';

		await dockerCompose.down( { config: dockerComposeConfigPath } );

		spinner.text = 'Stopped WordPress.';
	},

	/**
	 * Wipes the development server's database, the tests server's database, or both.
	 *
	 * @param {Object} options
	 * @param {string} options.environment The environment to clean. Either 'development', 'tests', or 'all'.
	 * @param {Object} options.spinner A CLI spinner which indicates progress.
	 */
	async clean( { environment, spinner } ) {
		const config = await initConfig();

		const description = `${ environment } environment${
			environment === 'all' ? 's' : ''
		}`;
		spinner.text = `Cleaning ${ description }.`;

		const tasks = [];

		if ( environment === 'all' || environment === 'development' ) {
			tasks.push(
				resetDatabase( 'development', config )
					.then( () => configureWordPress( 'development', config ) )
					.catch( () => {} )
			);
		}

		if ( environment === 'all' || environment === 'tests' ) {
			tasks.push(
				resetDatabase( 'tests', config )
					.then( () => configureWordPress( 'tests', config ) )
					.catch( () => {} )
			);
		}

		await Promise.all( tasks );

		spinner.text = `Cleaned ${ description }.`;
	},

	/**
	 * Runs an arbitrary command on the given Docker container.
	 *
	 * @param {Object} options
	 * @param {Object} options.container The Docker container to run the command on.
	 * @param {Object} options.command The command to run.
	 * @param {Object} options.spinner A CLI spinner which indicates progress.
	 */
	async run( { container, command, spinner } ) {
		const config = await initConfig();

		command = command.join( ' ' );

		spinner.text = `Running \`${ command }\` in '${ container }'.`;

		const result = await dockerCompose.run( container, command, {
			config: config.dockerComposeConfigPath,
			commandOptions: [ '--rm' ],
		} );

		if ( result.out ) {
			// eslint-disable-next-line no-console
			console.log(
				process.stdout.isTTY ? `\n\n${ result.out }\n\n` : result.out
			);
		} else if ( result.err ) {
			// eslint-disable-next-line no-console
			console.error(
				process.stdout.isTTY ? `\n\n${ result.err }\n\n` : result.err
			);
			throw result.err;
		}

		spinner.text = `Ran \`${ command }\` in '${ container }'.`;
	},

	ValidationError,
};

/**
 * Initializes the local environment so that Docker commands can be run. Reads
 * ./.wp-env.json, creates ~/.wp-env, and creates ~/.wp-env/docker-compose.yml.
 *
 * @return {Config} The-env config object.
 */
async function initConfig() {
	const configPath = path.resolve( '.wp-env.json' );
	const config = await readConfig( configPath );

	await fs.mkdir( config.workDirectoryPath, { recursive: true } );

	await fs.writeFile(
		config.dockerComposeConfigPath,
		yaml.dump( buildDockerComposeConfig( config ) )
	);

	return config;
}

/**
 * Copies a WordPress installation, taking care to ignore large directories
 * (.git, node_modules) and configuration files (wp-config.php).
 *
 * @param {string} fromPath Path to the WordPress directory to copy.
 * @param {string} toPath Destination path.
 */
async function copyCoreFiles( fromPath, toPath ) {
	await copyDir( fromPath, toPath, {
		filter( stat, filepath, filename ) {
			if ( stat === 'symbolicLink' ) {
				return false;
			}
			if ( stat === 'directory' && filename === '.git' ) {
				return false;
			}
			if ( stat === 'directory' && filename === 'node_modules' ) {
				return false;
			}
			if ( stat === 'file' && filename === 'wp-config.php' ) {
				return false;
			}
			return true;
		},
	} );
}

/**
 * Performs the given action again and again until it does not throw an error.
 *
 * @param {Function} action The action to perform.
 * @param {Object} options
 * @param {number} options.times How many times to try before giving up.
 * @param {number} [options.delay=5000] How long, in milliseconds, to wait between each try.
 */
async function retry( action, { times, delay = 5000 } ) {
	let tries = 0;
	while ( true ) {
		try {
			return await action();
		} catch ( error ) {
			if ( ++tries >= times ) {
				throw error;
			}
			await sleep( delay );
		}
	}
}

/**
 * Checks a WordPress database connection. An error is thrown if the test is
 * unsuccessful.
 *
 * @param {Config} config The wp-env config object.
 */
async function checkDatabaseConnection( { dockerComposeConfigPath } ) {
	await dockerCompose.run( 'cli', 'wp db check', {
		config: dockerComposeConfigPath,
		commandOptions: [ '--rm' ],
	} );
}

/**
 * Configures WordPress for the given environment by installing WordPress,
 * activating all plugins, and activating the first theme. These steps are
 * performed sequentially so as to not overload the WordPress instance.
 *
 * @param {string} environment The environment to configure. Either 'development' or 'tests'.
 * @param {Config} config The wp-env config object.
 */
async function configureWordPress( environment, config ) {
	const options = {
		config: config.dockerComposeConfigPath,
		commandOptions: [ '--rm' ],
	};

	// Install WordPress.
	await dockerCompose.run(
		environment === 'development' ? 'cli' : 'tests-cli',
		`wp core install
			--url=localhost:${
				environment === 'development'
					? process.env.WP_ENV_PORT || '8888'
					: process.env.WP_ENV_TESTS_PORT || '8889'
			}
			--title='${ config.name }'
			--admin_user=admin
			--admin_password=password
			--admin_email=wordpress@example.com
			--skip-email`,
		options
	);

	// Activate all plugins.
	for ( const pluginSource of config.pluginSources ) {
		await dockerCompose.run(
			environment === 'development' ? 'cli' : 'tests-cli',
			`wp plugin activate ${ pluginSource.basename }`,
			options
		);
	}

	// Activate the first theme.
	const [ themeSource ] = config.themeSources;
	if ( themeSource ) {
		await dockerCompose.run(
			environment === 'development' ? 'cli' : 'tests-cli',
			`wp theme activate ${ themeSource.basename }`,
			options
		);
	}
}

/**
 * Resets the development server's database, the tests server's database, or both.
 *
 * @param {string} environment The environment to clean. Either 'development', 'tests', or 'all'.
 * @param {Config} config The wp-env config object.
 */
async function resetDatabase( environment, { dockerComposeConfigPath } ) {
	const options = {
		config: dockerComposeConfigPath,
		commandOptions: [ '--rm' ],
	};

	const tasks = [];

	if ( environment === 'all' || environment === 'development' ) {
		tasks.push( dockerCompose.run( 'cli', 'wp db reset --yes', options ) );
	}

	if ( environment === 'all' || environment === 'tests' ) {
		tasks.push(
			dockerCompose.run( 'tests-cli', 'wp db reset --yes', options )
		);
	}

	await Promise.all( tasks );
}
