'use strict';
/**
 * External dependencies
 */
const path = require( 'path' );
const fs = require( 'fs' ).promises;
const os = require( 'os' );

/**
 * Internal dependencies
 */
const readRawConfigFile = require( './read-raw-config-file' );

/**
 * Gets the directory in which generated files are created.
 *
 * By default: '~/.wp-env/'. On Linux with snap packages: '~/wp-env/'. Can be
 * overridden with the WP_ENV_HOME environment variable.
 *
 * @param {string|null} configFilePath Config Path for .wp-env.json file if exists.
 *
 * @return {Promise<string>} The absolute path to the `wp-env` home directory.
 */
module.exports = async function getCacheDirectory( configFilePath = null ) {
	/**
	 * Allows user to override download location from .wp-env.json|.wp-env-override.json file.
	 * Moving this variable allows us not only move from node environment variables, but
	 * allows us to keep all our WP config at one place neat and tidy.
	 */
	if ( configFilePath ) {
		const rawConfig = await readRawConfigFile( configFilePath );
		if ( rawConfig?.config?.WP_ENV_HOME ) {
			return path.resolve( rawConfig.config.WP_ENV_HOME );
		}
	}

	// Allow user to override download location.
	if ( process.env.WP_ENV_HOME ) {
		return path.resolve( process.env.WP_ENV_HOME );
	}

	/**
	 * Installing docker with Snap Packages on Linux is common, but does not
	 * support hidden directories. Therefore, we use a public directory when
	 * snap packages exist.
	 *
	 * @see https://github.com/WordPress/gutenberg/issues/20180#issuecomment-587046325
	 */
	let usesSnap;
	try {
		await fs.stat( '/snap' );
		usesSnap = true;
	} catch {
		usesSnap = false;
	}

	return path.resolve( os.homedir(), usesSnap ? 'wp-env' : '.wp-env' );
};
