'use strict';
/**
 * External dependencies
 */
const util = require( 'util' );
const { v2: dockerCompose } = require( 'docker-compose' );

/**
 * Promisified dependencies
 */
const copyDir = util.promisify( require( 'copy-dir' ) );

/**
 * Internal dependencies
 */
const { readWordPressVersion } = require( '../../wordpress' );

/**
 * @typedef {import('../../config').WPConfig} WPConfig
 * @typedef {import('../../config').WPEnvironmentConfig} WPEnvironmentConfig
 * @typedef {import('../../config').WPSource} WPSource
 * @typedef {'development'|'tests'} WPEnvironment
 * @typedef {'development'|'tests'|'all'} WPEnvironmentSelection
 */

/**
 * Utility function to check if a WordPress version is lower than another version.
 *
 * This is a non-comprehensive check only intended for this usage, to avoid pulling in a full semver library.
 * It only considers the major and minor portions of the version and ignores the rest. Additionally, it assumes that
 * the minor version is always a single digit (i.e. 0-9).
 *
 * Do not use this function for general version comparison, as it will not work for all cases.
 *
 * @param {string} version        The version to check.
 * @param {string} compareVersion The compare version to check whether the version is lower than.
 * @return {boolean} True if the version is lower than the compare version, false otherwise.
 */
function isWPMajorMinorVersionLower( version, compareVersion ) {
	const versionNumber = Number.parseFloat(
		version.match( /^[0-9]+(\.[0-9]+)?/ )[ 0 ]
	);
	const compareVersionNumber = Number.parseFloat(
		compareVersion.match( /^[0-9]+(\.[0-9]+)?/ )[ 0 ]
	);

	return versionNumber < compareVersionNumber;
}

/**
 * Configures WordPress for the given environment by installing WordPress,
 * activating all plugins, and activating the first theme. These steps are
 * performed sequentially so as to not overload the WordPress instance.
 *
 * @param {WPEnvironment} environment The environment to configure. Either 'development' or 'tests'.
 * @param {WPConfig}      config      The wp-env config object.
 * @param {Object}        spinner     A CLI spinner which indicates progress.
 */
async function configureWordPress( environment, config, spinner ) {
	let wpVersion = '';
	try {
		wpVersion = await readWordPressVersion(
			config.env[ environment ].coreSource,
			spinner,
			config.debug
		);
	} catch ( err ) {
		// Ignore error.
	}

	// Create a project-specific wp-cli configuration, important for the `rewrite` command.
	// Don't overwrite existing configuration.
	const cliConfigCommand = `[ -f /var/www/html/wp-cli.yml ] || (
		exec > /var/www/html/wp-cli.yml
		echo "apache_modules:"
		echo "  - mod_rewrite"
	)`;

	const isMultisite = config.env[ environment ].multisite;

	const installMethod = isMultisite ? 'multisite-install' : 'install';
	const installCommand = `wp core ${ installMethod } --url="${ config.env[ environment ].config.WP_SITEURL }" --title="${ config.name }" --admin_user=admin --admin_password=password --admin_email=wordpress@example.com --skip-email`;

	// -eo pipefail exits the command as soon as anything fails in bash.
	const setupCommands = [
		'set -eo pipefail',
		cliConfigCommand,
		installCommand,
	];

	// Bootstrap .htaccess for multisite
	if ( isMultisite ) {
		// Using a subshell with `exec` was the best tradeoff I could come up
		// with between readability of this source and compatibility with the
		// way that all strings in `setupCommands` are later joined with '&&'.
		setupCommands.push(
			`(
exec > /var/www/html/.htaccess
echo 'RewriteEngine On'
echo 'RewriteRule .* - [E=HTTP_AUTHORIZATION:%{HTTP:Authorization}]'
echo 'RewriteBase /'
echo 'RewriteRule ^index\\.php$ - [L]'
echo ''
echo '# add a trailing slash to /wp-admin'
echo 'RewriteRule ^([_0-9a-zA-Z-]+/)?wp-admin$ $1wp-admin/ [R=301,L]'
echo ''
echo 'RewriteCond %{REQUEST_FILENAME} -f [OR]'
echo 'RewriteCond %{REQUEST_FILENAME} -d'
echo 'RewriteRule ^ - [L]'
echo 'RewriteRule ^([_0-9a-zA-Z-]+/)?(wp-(content|admin|includes).*) $2 [L]'
echo 'RewriteRule ^([_0-9a-zA-Z-]+/)?(.*\\.php)$ $2 [L]'
echo 'RewriteRule . index.php [L]'
)`
		);
	}

	// WordPress versions below 5.1 didn't use proper spacing in wp-config.
	const configAnchor =
		wpVersion && isWPMajorMinorVersionLower( wpVersion, '5.1' )
			? `"define('WP_DEBUG',"`
			: `"define( 'WP_DEBUG',"`;

	// Set wp-config.php values.
	for ( let [ key, value ] of Object.entries(
		config.env[ environment ].config
	) ) {
		// Allow the configuration to skip a default constant by specifying it as null.
		if ( null === value ) {
			continue;
		}

		// Add quotes around string values to work with multi-word strings better.
		value = typeof value === 'string' ? `"${ value }"` : value;
		setupCommands.push(
			`wp config set ${ key } ${ value } --anchor=${ configAnchor }${
				typeof value !== 'string' ? ' --raw' : ''
			}`
		);
	}

	// Activate all plugins.
	for ( const pluginSource of config.env[ environment ].pluginSources ) {
		setupCommands.push( `wp plugin activate ${ pluginSource.basename }` );
	}

	if ( config.debug ) {
		spinner.info(
			`Running the following setup commands on the ${ environment } instance:\n - ${ setupCommands.join(
				'\n - '
			) }\n`
		);
	}

	// Execute all setup commands in a batch.
	await dockerCompose.run(
		environment === 'development' ? 'cli' : 'tests-cli',
		[ 'bash', '-c', setupCommands.join( ' && ' ) ],
		{
			config: config.dockerComposeConfigPath,
			commandOptions: [ '--rm' ],
			log: config.debug,
		}
	);

	// WordPress versions below 5.1 didn't use proper spacing in wp-config.
	// Additionally, WordPress versions below 5.4 used `dirname( __FILE__ )` instead of `__DIR__`.
	let abspathDef = `define( 'ABSPATH', __DIR__ . '\\/' );`;
	if ( wpVersion && isWPMajorMinorVersionLower( wpVersion, '5.1' ) ) {
		abspathDef = `define('ABSPATH', dirname(__FILE__) . '\\/');`;
	} else if ( wpVersion && isWPMajorMinorVersionLower( wpVersion, '5.4' ) ) {
		abspathDef = `define( 'ABSPATH', dirname( __FILE__ ) . '\\/' );`;
	}

	// WordPress' PHPUnit suite expects a `wp-tests-config.php` in
	// the directory that the test suite is contained within.
	// Make sure ABSPATH points to the WordPress install.
	await dockerCompose.exec(
		environment === 'development' ? 'wordpress' : 'tests-wordpress',
		[
			'sh',
			'-c',
			`sed -e "/^require.*wp-settings.php/d" -e "s/${ abspathDef }/define( 'ABSPATH', '\\/var\\/www\\/html\\/' );\\n\\tdefine( 'WP_DEFAULT_THEME', 'default' );/" /var/www/html/wp-config.php > /wordpress-phpunit/wp-tests-config.php`,
		],
		{
			config: config.dockerComposeConfigPath,
			log: config.debug,
		}
	);
}

/**
 * Resets the development server's database, the tests server's database, or both.
 *
 * @param {WPEnvironmentSelection} environment The environment to clean. Either 'development', 'tests', or 'all'.
 * @param {WPConfig}               config      The wp-env config object.
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
 * Sets up WordPress directories, copying core files if needed.
 *
 * @param {WPConfig} config The wp-env config object.
 */
async function setupWordPressDirectories( config ) {
	if (
		config.env.development.coreSource &&
		hasSameCoreSource( [ config.env.development, config.env.tests ] )
	) {
		await copyCoreFiles(
			config.env.development.coreSource.path,
			config.env.development.coreSource.testsPath
		);
	}
}

/**
 * Returns true if all given environment configs have the same core source.
 *
 * @param {WPEnvironmentConfig[]} envs An array of environments to check.
 *
 * @return {boolean} True if all the environments have the same core source.
 */
function hasSameCoreSource( envs ) {
	if ( envs.length < 2 ) {
		return true;
	}
	return ! envs.some( ( env ) =>
		areCoreSourcesDifferent( envs[ 0 ].coreSource, env.coreSource )
	);
}

/**
 * Checks if two core sources are different.
 *
 * @param {WPSource} coreSource1 First core source.
 * @param {WPSource} coreSource2 Second core source.
 * @return {boolean} True if the sources are different.
 */
function areCoreSourcesDifferent( coreSource1, coreSource2 ) {
	if (
		( ! coreSource1 && coreSource2 ) ||
		( coreSource1 && ! coreSource2 )
	) {
		return true;
	}

	if ( coreSource1 && coreSource2 && coreSource1.path !== coreSource2.path ) {
		return true;
	}

	return false;
}

/**
 * Copies a WordPress installation, taking care to ignore large directories
 * (.git, node_modules) and configuration files (wp-config.php).
 *
 * @param {string} fromPath Path to the WordPress directory to copy.
 * @param {string} toPath   Destination path.
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
	configureWordPress,
	resetDatabase,
	setupWordPressDirectories,
	hasSameCoreSource,
};
