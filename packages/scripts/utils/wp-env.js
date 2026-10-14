const { existsSync } = require( 'node:fs' );
const path = require( 'node:path' );

/**
 * @typedef {import('../../env/lib/config/load-config').WPConfig} WPConfig
 */

/**
 * Name of the config file for a dedicated test environment, which `wp-env`
 * starts with `--config`. It replaces the deprecated `testsEnvironment`.
 */
const TESTS_CONFIG_FILE = '.wp-env.test.json';

/**
 * Returns the directory containing the `wp-env` config files for the project.
 *
 * Tests may run from a subdirectory of the project, such as an npm workspace
 * for the end-to-end tests run via `npm exec --workspace`, while the `wp-env`
 * config files are at the project root. So this searches upward from the
 * starting directory for the nearest directory with a `.wp-env.json` or
 * `.wp-env.test.json`, but not above the project root, so that an unrelated
 * config in an enclosing directory is never picked up. Without a project root
 * containing the starting directory, only the starting directory is used.
 *
 * @param {string}           fromDirectory The directory to start from, usually the current working directory.
 * @param {string|undefined} rootDirectory The project root, usually `npm_config_local_prefix` as set by npm.
 *
 * @return {string} The directory containing the config files, or the starting directory if none was found.
 */
function findConfigDirectory( fromDirectory, rootDirectory ) {
	const startDirectory = path.resolve( fromDirectory );
	if ( ! rootDirectory ) {
		return startDirectory;
	}

	const root = path.resolve( rootDirectory );
	const relativePath = path.relative( root, startDirectory );
	if ( relativePath.startsWith( '..' ) || path.isAbsolute( relativePath ) ) {
		return startDirectory;
	}

	for (
		let directory = startDirectory;
		;
		directory = path.dirname( directory )
	) {
		if (
			[ '.wp-env.json', TESTS_CONFIG_FILE ].some( ( fileName ) =>
				existsSync( path.join( directory, fileName ) )
			)
		) {
			return directory;
		}
		if ( directory === root ) {
			return startDirectory;
		}
	}
}

/**
 * Returns the base URL of the `wp-env` environment that end-to-end tests run
 * against.
 *
 * A project with a `.wp-env.test.json` runs its tests against the environment
 * that this config file defines, so it is loaded instead of `.wp-env.json`.
 * Either way, `wp-env` merges in the matching override file (for example
 * `.wp-env.test.override.json`) and any `WP_ENV_*` environment variables, so
 * the port is the one that `wp-env start` actually uses.
 *
 * A config that still enables the deprecated tests environment runs the tests
 * against that environment. Otherwise there is only the development
 * environment, so that is the one to test.
 *
 * Versions of `@wordpress/env` before support for `--config` ignore the custom
 * config path, and so they return the default config with its tests
 * environment, as before.
 *
 * @param {(configDirectoryPath: string, customConfigPath?: string|null) => Promise<WPConfig>} loadConfig          The `loadConfig()` function from `@wordpress/env`.
 * @param {string}                                                                             configDirectoryPath Directory containing the `wp-env` config files.
 *
 * @return {Promise<string|null>} Base URL, or null if no port is configured.
 */
async function getTestsBaseUrl( loadConfig, configDirectoryPath ) {
	const testsConfigPath = path.join( configDirectoryPath, TESTS_CONFIG_FILE );

	// The custom config path must be absolute, since `wp-env` resolves it
	// relative to the current working directory.
	const envConfig = await loadConfig(
		configDirectoryPath,
		existsSync( testsConfigPath ) ? testsConfigPath : null
	);

	const port =
		envConfig?.env?.tests?.port ?? envConfig?.env?.development?.port;

	return port ? `http://localhost:${ port }` : null;
}

module.exports = {
	findConfigDirectory,
	getTestsBaseUrl,
};
