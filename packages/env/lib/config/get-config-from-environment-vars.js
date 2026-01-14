'use strict';
/**
 * Internal dependencies
 */
const {
	parseSourceString,
	includeTestsPath,
} = require( './parse-source-string' );
const {
	checkPort,
	checkPortRangeValue,
	checkVersion,
	checkString,
} = require( './validate-config' );

/**
 * @typedef {import('./parse-source-string').WPSource} WPSource
 */

/**
 * Environment variable configuration.
 *
 * @typedef WPEnvironmentVariableConfig
 * @property {?number}                  port              An override for the development environment's port.
 * @property {?number}                  portRangeMin      Minimum port for development environment.
 * @property {?number}                  portRangeMax      Maximum port for development environment.
 * @property {?number}                  mysqlPort         An override for the development environment's MySQL port.
 * @property {?number}                  testsPort         An override for the testing environment's port.
 * @property {?number}                  testsPortRangeMin Minimum port for testing environment.
 * @property {?number}                  testsPortRangeMax Maximum port for testing environment.
 * @property {?number}                  testsMysqlPort    An override for the testing environment's MySQL port.
 * @property {?number}                  phpmyadminPort    An override for the development environment's phpMyAdmin port.
 * @property {?WPSource}                coreSource        An override for all environment's coreSource.
 * @property {?string}                  phpVersion        An override for all environment's PHP version.
 * @property {?Object.<string, string>} lifecycleScripts  An override for various lifecycle scripts.
 */

/**
 * Gets configuration options from environment variables.
 *
 * @param {string} cacheDirectoryPath Path to the work directory located in ~/.wp-env.
 *
 * @return {WPEnvironmentVariableConfig} Any configuration options parsed from the environment variables.
 */
module.exports = function getConfigFromEnvironmentVars( cacheDirectoryPath ) {
	const environmentConfig = {
		port: getPortFromEnvironmentVariable( 'WP_ENV_PORT' ),
		portRangeMin: getPortRangeFromEnvironmentVariable(
			'WP_ENV_PORT_RANGE_MIN'
		),
		portRangeMax: getPortRangeFromEnvironmentVariable(
			'WP_ENV_PORT_RANGE_MAX'
		),
		mysqlPort: getPortFromEnvironmentVariable( 'WP_ENV_MYSQL_PORT' ),
		testsPort: getPortFromEnvironmentVariable( 'WP_ENV_TESTS_PORT' ),
		testsPortRangeMin: getPortRangeFromEnvironmentVariable(
			'WP_ENV_TESTS_PORT_RANGE_MIN'
		),
		testsPortRangeMax: getPortRangeFromEnvironmentVariable(
			'WP_ENV_TESTS_PORT_RANGE_MAX'
		),
		testsMysqlPort: getPortFromEnvironmentVariable(
			'WP_ENV_TESTS_MYSQL_PORT'
		),
		phpmyadminPort: getPortFromEnvironmentVariable(
			'WP_ENV_PHPMYADMIN_PORT'
		),
		testsPhpmyadminPort: getPortFromEnvironmentVariable(
			'WP_ENV_TESTS_PHPMYADMIN_PORT'
		),
		lifecycleScripts: getLifecycleScriptOverrides(),
	};

	if ( process.env.WP_ENV_CORE ) {
		environmentConfig.coreSource = includeTestsPath(
			parseSourceString( process.env.WP_ENV_CORE, {
				cacheDirectoryPath,
			} ),
			{ cacheDirectoryPath }
		);
	}

	if ( process.env.WP_ENV_PHP_VERSION ) {
		checkVersion(
			'environment variable',
			'WP_ENV_PHP_VERSION',
			process.env.WP_ENV_PHP_VERSION
		);
		environmentConfig.phpVersion = process.env.WP_ENV_PHP_VERSION;
	}

	return environmentConfig;
};

/**
 * Parses an environment variable which should be a port.
 *
 * @param {string} varName The environment variable to check (e.g. WP_ENV_PORT).
 *
 * @return {number} The parsed port number.
 */
function getPortFromEnvironmentVariable( varName ) {
	if ( ! process.env[ varName ] ) {
		return undefined;
	}

	const port = parseInt( process.env[ varName ] );

	// Throw an error if it is not parseable as a number.
	checkPort( 'environment variable', varName, port );

	return port;
}

/**
 * Parses an environment variable which should be a port range value (min or max).
 *
 * @param {string} varName The environment variable to check.
 *
 * @return {number} The parsed port range value.
 */
function getPortRangeFromEnvironmentVariable( varName ) {
	if ( ! process.env[ varName ] ) {
		return undefined;
	}

	const port = parseInt( process.env[ varName ] );

	// Throw an error if it is not parseable as a valid port.
	checkPortRangeValue( 'environment variable', varName, port );

	return port;
}

/**
 * Parses the lifecycle script environment variables.
 *
 * @return {Object.<string, string>} The parsed lifecycle scripts.
 */
function getLifecycleScriptOverrides() {
	const lifecycleScripts = {};

	// Find all of the lifecycle script overrides and parse them.
	const lifecycleEnvironmentVars = {
		WP_ENV_LIFECYCLE_SCRIPT_AFTER_START: 'afterStart',
		WP_ENV_LIFECYCLE_SCRIPT_AFTER_CLEAN: 'afterClean',
		WP_ENV_LIFECYCLE_SCRIPT_AFTER_RESET: 'afterReset',
		WP_ENV_LIFECYCLE_SCRIPT_AFTER_CLEANUP: 'afterCleanup',
		WP_ENV_LIFECYCLE_SCRIPT_AFTER_DESTROY: 'afterDestroy',
	};
	for ( const envVar in lifecycleEnvironmentVars ) {
		const scriptValue = process.env[ envVar ];
		if ( scriptValue === undefined ) {
			continue;
		}

		checkString( 'environment variable', envVar, scriptValue );
		lifecycleScripts[ lifecycleEnvironmentVars[ envVar ] ] = scriptValue;
	}

	return lifecycleScripts;
}
