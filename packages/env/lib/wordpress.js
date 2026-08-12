'use strict';
const dns = require( 'dns' ).promises;
const fs = require( 'fs' ).promises;
const path = require( 'path' );
const got = require( 'got' );
const SimpleGit = require( 'simple-git' );
const { getCache, setCache } = require( './cache' );

const WORDPRESS_MIRROR_URL = 'https://github.com/WordPress/WordPress.git';

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
 * Returns every stable version tag currently on the WordPress/WordPress mirror.
 * The stable-check API on WordPress.org reports a new version the moment it
 * ships, but this mirror syncs separately and can lag by hours, during which a
 * `git fetch` for that version's tag fails outright because it is not there yet.
 *
 * @return {string[]} Every available version, like [ '6.5.8', '6.5.9' ]. Empty
 *                     if the mirror could not be queried.
 */
async function getMirrorVersions() {
	try {
		const output = await SimpleGit().listRemote( [
			'--tags',
			WORDPRESS_MIRROR_URL,
		] );
		return output
			.split( '\n' )
			.map( ( line ) =>
				line.match( /refs\/tags\/(\d+\.\d+(?:\.\d+)?)$/ )
			)
			.filter( Boolean )
			.map( ( match ) => match[ 1 ] );
	} catch {
		return [];
	}
}

/**
 * Compares two dotted-numeric WordPress version strings, like "6.5.9" and
 * "6.5.10". This only handles the plain major[.minor[.patch]] shape core
 * release tags use, not general semver -- see isWPMajorMinorVersionLower()
 * in runtime/docker/wordpress.js for the project's existing stance on
 * avoiding a full semver dependency for this kind of comparison.
 *
 * @param {string} a A version string.
 * @param {string} b Another version string.
 * @return {number} Negative if a < b, positive if a > b, zero if equal.
 */
function compareWordPressVersions( a, b ) {
	const partsA = a.split( '.' ).map( Number );
	const partsB = b.split( '.' ).map( Number );

	for ( let i = 0; i < Math.max( partsA.length, partsB.length ); i++ ) {
		const diff = ( partsA[ i ] || 0 ) - ( partsB[ i ] || 0 );
		if ( diff !== 0 ) {
			return diff;
		}
	}

	return 0;
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
			const mirrorVersions = await getMirrorVersions();

			// If the mirror listing failed, mirrorVersions is empty and this
			// is skipped -- that isn't confirmation the tag is missing, so
			// fall through to using the reported version as before.
			if (
				mirrorVersions.length &&
				! mirrorVersions.includes( version )
			) {
				// The mirror hasn't synced this tag yet. Prefer the last known
				// good version from a previous run; if there isn't one (e.g.
				// the first run in a fresh CI environment), use the highest
				// version the mirror actually has instead of a tag that is
				// guaranteed to fail the `git fetch` that follows.
				//
				// This substitution is silent: `options` at this stage of
				// config parsing carries no spinner or logger to surface it
				// through, and this is the only function in the package that
				// would need one introduced for a single warning. Worth a
				// user-facing message in a follow-up if this proves confusing
				// in practice.
				const fallback =
					( await getCache(
						'latestWordPressVersion',
						cacheOptions
					) ) ||
					[ ...mirrorVersions ]
						.sort( compareWordPressVersions )
						.pop();

				CACHED_WP_VERSION = fallback;
				await setCache(
					'latestWordPressVersion',
					fallback,
					cacheOptions
				);
				return fallback;
			}

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
