/**
 * @typedef {import('../../env/lib/config/load-config').WPConfig} WPConfig
 */

/**
 * Name of the CLI option for the custom `wp-env` config file, which is passed
 * to `wp-env` with `--config`. It is distinct from `--config`, which names the
 * Playwright config file.
 */
const WP_ENV_CONFIG_ARG = '--wp-env-config';

/**
 * Separates the `--wp-env-config` option from the other CLI arguments, which
 * are passed on to Playwright, since it rejects options it does not know.
 *
 * The option accepts its value either as `--wp-env-config=<path>` or as
 * `--wp-env-config <path>`.
 *
 * @param {string[]} args CLI arguments.
 *
 * @return {{wpEnvConfig: string|null|undefined, args: string[]}} The value of the option, if passed (null when it has no value), and the remaining arguments.
 */
function extractWpEnvConfigArg( args ) {
	let wpEnvConfig;
	const remainingArgs = [];
	for ( let i = 0; i < args.length; i++ ) {
		if ( args[ i ] === WP_ENV_CONFIG_ARG ) {
			wpEnvConfig = args[ i + 1 ] ?? null;
			i++;
		} else if ( args[ i ].startsWith( `${ WP_ENV_CONFIG_ARG }=` ) ) {
			wpEnvConfig =
				args[ i ].slice( WP_ENV_CONFIG_ARG.length + 1 ) || null;
		} else {
			remainingArgs.push( args[ i ] );
		}
	}
	return { wpEnvConfig, args: remainingArgs };
}

/**
 * Returns the base URL of the `wp-env` environment that end-to-end tests run
 * against.
 *
 * This loads `.wp-env.json` from the config directory, or else the custom
 * config file passed to `wp-env` with `--config`, such as a
 * `.wp-env.test.json` for a dedicated test environment. Either way, `wp-env`
 * merges in the override file of that config (`.wp-env.override.json` or
 * `.wp-env.test.override.json`, for example) and any `WP_ENV_*` environment
 * variables, so the port is the one that `wp-env start` uses with the same
 * config.
 *
 * A config that still enables the deprecated tests environment runs the tests
 * against that environment. Otherwise there is only the development
 * environment, so that is the one to test.
 *
 * Versions of `@wordpress/env` before support for `--config` ignore the custom
 * config path, and so they return the default config.
 *
 * @param {(configDirectoryPath: string, customConfigPath?: string|null) => Promise<WPConfig>} loadConfig          The `loadConfig()` function from `@wordpress/env`.
 * @param {string}                                                                             configDirectoryPath Directory containing the `wp-env` config files.
 * @param {string|null}                                                                        [customConfigPath]  Absolute path to a custom config file, if any.
 *
 * @return {Promise<string|null>} Base URL, or null if no port is configured.
 */
async function getTestsBaseUrl(
	loadConfig,
	configDirectoryPath,
	customConfigPath = null
) {
	const envConfig = await loadConfig( configDirectoryPath, customConfigPath );

	const port =
		envConfig?.env?.tests?.port ?? envConfig?.env?.development?.port;

	return port ? `http://localhost:${ port }` : null;
}

module.exports = {
	extractWpEnvConfigArg,
	getTestsBaseUrl,
};
