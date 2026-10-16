/**
 * @typedef {import('../../env/lib/config/load-config').WPConfig} WPConfig
 */

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
	getTestsBaseUrl,
};
