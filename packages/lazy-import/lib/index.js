/**
 * External dependencies
 */
const npmPackageArg = require( 'npm-package-arg' );
const semver = require( 'semver' );
const execa = require( 'execa' );
const { join } = require( 'path' );
const { createHash } = require( 'crypto' );

/**
 * @typedef WPLazyImportOptions
 *
 * @property {string}   [localPath] Path to the local directory or file.
 * @property {()=>void} [onInstall] Callback to invoke when install starts.
 */

/**
 * Returns an md5 hash of the given string.
 *
 * @param {string} text Text for which to generate hash.
 *
 * @return {string} md5 hash of string.
 */
function md5( text ) {
	return createHash( 'md5' ).update( text ).digest( 'hex' );
}

/**
 * Given an arg string as would be passed to `npm install`, returns a string to
 * use as the alias name of the package to install locally if needed.
 *
 * @param {string} arg A string that you might pass to `npm install`.
 *
 * @return {string} Module to use as local package alias.
 */
function getLocalModuleName( arg ) {
	return '@wordpress/lazy-import.' + md5( arg );
}

/**
 * Installs npm package by arg name at the given prefix path. Creates the prefix
 * path if it doesn't yet exist.
 *
 * @param {string} arg   Package install arg (name and version specification).
 * @param {string} alias Alias to use for local module name.
 *
 * @return {Promise<void>} Promise resolving once package is installed.
 */
async function install( arg, alias ) {
	await execa( 'npm', [ 'install', '--no-save', alias + '@npm:' + arg ] );
}

/**
 * Given an arg string as would be passed to `npm install`, requires the package
 * corresponding to the name and specifier parsed from the arg. If the package
 * is not installed (or not installed at that version), the package is installed
 * to a temporary directory at `node_modules/.wp-lazy` relative to where the
 * current working directory.
 *
 * @param {string}                       arg       A string that you might pass
 *                                                 to `npm install`.
 * @param {Partial<WPLazyImportOptions>} [options] Optional options object.
 *
 * @return {Promise<NodeRequire>} Promise resolving to required module.
 */
async function lazyImport( arg, options = {} ) {
	const { localPath = '' } = options;
	const { rawSpec, name } = npmPackageArg( arg );

	if ( ! name ) {
		throw new TypeError(
			`Unable to parse package name from \`${ arg }\`.`
		);
	}

	const localModule = getLocalModuleName( arg );

	// Try first from the temporary install path, since the second attempt will
	// need to verify both availability and version. Version isn't necessary to
	// account for in this first attempt.
	try {
		if ( require.resolve( localModule ) ) {
			return require( join( localModule, localPath ) );
		}
	} catch ( error ) {
		if ( error.code !== 'MODULE_NOT_FOUND' ) {
			throw error;
		}
	}

	try {
		const { version } = require( join( name, 'package.json' ) );
		if ( semver.satisfies( version, rawSpec ) ) {
			// Only return with the resolved module if the version is valid per
			// the parsed arg. Otherwise, fall through to install stage.
			return require( join( name, localPath ) );
		}
	} catch ( error ) {
		if ( error.code !== 'MODULE_NOT_FOUND' ) {
			throw error;
		}
	}

	// If this point is reached, the module cannot be found and must be
	// installed.
	if ( options.onInstall ) {
		options.onInstall();
	}

	try {
		await install( arg, localModule );
	} catch ( error ) {
		// Format connectivity error to one which can be easily evaluated.
		if (
			error.stderr &&
			error.stderr.startsWith( 'npm ERR! code ENOTFOUND' )
		) {
			error = new Error( 'Unable to connect to NPM registry' );
			error.code = 'ENOTFOUND';
		}

		throw error;
	}

	// Note: For those familiar with the internals of module importing, the
	// second attempt here at requiring the same package as earlier may stand
	// out as being susceptible to conflicting with module caching.
	//
	// https://nodejs.org/api/modules.html#modules_require_cache
	//
	// Testing appears to indicate that module results are not cached if it
	// fails to resolve, which is what we can assume would have happened in the
	// first attempt to require the module. Thus, it's not required to reset any
	// values from `require.cache`.
	//
	// See: https://github.com/WordPress/gutenberg/pull/22684#discussion_r434583858

	return require( join( localModule, localPath ) );
}

module.exports = lazyImport;
