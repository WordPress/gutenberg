/**
 * External dependencies
 */
const dockerCompose = require( 'docker-compose' );
const util = require( 'util' );

/**
 * Promisified dependencies
 */
const copyDir = util.promisify( require( 'copy-dir' ) );

/**
 * @typedef {import('./config').Config} Config
 */

/**
 * Makes the WordPress content directories (wp-content, wp-content/plugins,
 * wp-content/themes) owned by the www-data user. This ensures that WordPress
 * can write to these directories.
 *
 * This is necessary when running wp-env with `"core": null` because Docker
 * will automatically create these directories as the root user when binding
 * volumes during `docker-compose up`, and `docker-compose up` doesn't support
 * the `-u` option.
 *
 * See https://github.com/docker-library/wordpress/issues/436.
 *
 * @param {string} environment The environment to check. Either 'development' or 'tests'.
 * @param {Config} config The wp-env config object.
 */
async function makeContentDirectoriesWritable(
	environment,
	{ dockerComposeConfigPath, debug }
) {
	await dockerCompose.exec(
		environment === 'development' ? 'wordpress' : 'tests-wordpress',
		'chown www-data:www-data wp-content wp-content/plugins wp-content/themes',
		{
			config: dockerComposeConfigPath,
			log: debug,
		}
	);
}

/**
 * Checks a WordPress database connection. An error is thrown if the test is
 * unsuccessful.
 *
 * @param {Config} config The wp-env config object.
 */
async function checkDatabaseConnection( { dockerComposeConfigPath, debug } ) {
	await dockerCompose.run( 'cli', 'wp db check', {
		config: dockerComposeConfigPath,
		commandOptions: [ '--rm' ],
		log: debug,
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
		log: config.debug,
	};

	const port = environment === 'development' ? config.port : config.testsPort;

	// Install WordPress.
	await dockerCompose.run(
		environment === 'development' ? 'cli' : 'tests-cli',
		[
			'wp',
			'core',
			'install',
			`--url=localhost:${ port }`,
			`--title=${ config.name }`,
			'--admin_user=admin',
			'--admin_password=password',
			'--admin_email=wordpress@example.com',
			'--skip-email',
		],
		options
	);

	// Set wp-config.php values.
	for ( const [ key, value ] of Object.entries( config.config ) ) {
		// Ensure correct port setting from config when configure WP urls.
		if (key === 'WP_SITEURL' || key === 'WP_HOME') {
			const url = new URL(value);
			url.port = port;
			value = url.toString();
		}
		const command = [ 'wp', 'config', 'set', key, value ];
		if ( typeof value !== 'string' ) {
			command.push( '--raw' );
		}
		await dockerCompose.run(
			environment === 'development' ? 'cli' : 'tests-cli',
			command,
			options
		);
	}

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
async function resetDatabase(
	environment,
	{ dockerComposeConfigPath, debug }
) {
	const options = {
		config: dockerComposeConfigPath,
		commandOptions: [ '--rm' ],
		log: debug,
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

module.exports = {
	makeContentDirectoriesWritable,
	checkDatabaseConnection,
	configureWordPress,
	resetDatabase,
	copyCoreFiles,
};
