'use strict';
/**
 * External dependencies
 */
const dns = require( 'dns' ).promises;
const fs = require( 'fs' ).promises;
const path = require( 'path' );
const got = require( 'got' );

/**
 * Internal dependencies
 */
const { getCache, setCache } = require( './cache' );

/**
 * @typedef {import('./config').WPSource} WPSource
 */

/**
 * Scans through a WordPress source to find the version of WordPress it contains.
 *
 * @param {WPSource} coreSource The WordPress source.
 * @param {Object}   spinner    A CLI spinner which indicates progress.
 * @param {boolean}  debug      Indicates whether or not the CLI is in debug mode.
 * @return {string} The version of WordPress the source is for.
 */
async function readWordPressVersion( coreSource, spinner, debug ) {
	const versionFilePath = path.join(
		coreSource.path,
		'wp-includes',
		'version.php'
	);
	const versionFile = await fs.readFile( versionFilePath, {
		encoding: 'utf-8',
	} );
	const versionMatch = versionFile.match(
		/\$wp_version = '([A-Za-z\-0-9.]+)'/
	);
	if ( ! versionMatch ) {
		throw new Error( `Failed to find version in ${ versionFilePath }` );
	}

	if ( debug ) {
		spinner.info(
			`Found WordPress ${ versionMatch[ 1 ] } in ${ versionFilePath }.`
		);
	}

	return versionMatch[ 1 ];
}

/**
 * Basically a quick check to see if we can connect to the internet.
 *
 * @return {boolean} True if we can connect to WordPress.org, false otherwise.
 */
let IS_OFFLINE;
async function canAccessWPORG() {
	// Avoid situations where some parts of the code think we're offline and others don't.
	if ( IS_OFFLINE !== undefined ) {
		return IS_OFFLINE;
	}
	IS_OFFLINE = !! ( await dns.resolve( 'WordPress.org' ).catch( () => {} ) );
	return IS_OFFLINE;
}

/**
 * Returns the latest stable version of WordPress by requesting the stable-check
 * endpoint on WordPress.org.
 *
 * @param {Object} options an object with cacheDirectoryPath set to the path to the cache directory in ~/.wp-env.
 * @return {string} The latest stable version of WordPress, like "6.0.1"
 */
let CACHED_WP_VERSION;
async function getLatestWordPressVersion( options ) {
	// Avoid extra network requests.
	if ( CACHED_WP_VERSION ) {
		return CACHED_WP_VERSION;
	}

	const cacheOptions = {
		workDirectoryPath: options.cacheDirectoryPath,
	};

	// When we can't connect to the internet, we don't want to break wp-env or
	// wait for the stable-check result to timeout.
	if ( ! ( await canAccessWPORG() ) ) {
		const latestVersion = await getCache(
			'latestWordPressVersion',
			cacheOptions
		);
		if ( ! latestVersion ) {
			throw new Error(
				'Could not find the current WordPress version in the cache and the network is not available.'
			);
		}
		return latestVersion;
	}

	const versions = await got(
		'https://api.wordpress.org/core/stable-check/1.0/'
	).json();

	for ( const [ version, status ] of Object.entries( versions ) ) {
		if ( status === 'latest' ) {
			CACHED_WP_VERSION = version;
			await setCache( 'latestWordPressVersion', version, cacheOptions );
			return version;
		}
	}
}

module.exports = {
	readWordPressVersion,
	canAccessWPORG,
	getLatestWordPressVersion,
};
