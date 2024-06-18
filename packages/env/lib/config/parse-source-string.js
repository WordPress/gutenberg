'use strict';
/**
 * External dependencies
 */
const path = require( 'path' );
const os = require( 'os' );

/**
 * Internal dependencies
 */
const { ValidationError } = require( './validate-config' );

/**
 * A WordPress installation, plugin or theme to be loaded into the environment.
 *
 * @typedef WPSource
 * @property {'local'|'git'|'zip'} type     The source type.
 * @property {string}              path     The path to the WordPress installation, plugin or theme.
 * @property {?string}             url      The URL to the source download if the source type is not local.
 * @property {?string}             ref      The git ref for the source if the source type is 'git'.
 * @property {string}              basename Name that identifies the WordPress installation, plugin or theme.
 */

/**
 * The string at the beginning of a source path that points to a home-relative
 * directory. Will be '~/' on unix environments and '~\' on Windows.
 */
const HOME_PATH_PREFIX = `~${ path.sep }`;

/**
 * Parses a source string into a source object.
 *
 * @param {?string} sourceString               The source string. See README.md for documentation on valid source string patterns.
 * @param {Object}  options
 * @param {string}  options.cacheDirectoryPath Path to the work directory located in ~/.wp-env.
 *
 * @return {?WPSource} A source object.
 */
function parseSourceString( sourceString, { cacheDirectoryPath } ) {
	if ( sourceString === null ) {
		return null;
	}

	if (
		sourceString.startsWith( '.' ) ||
		sourceString.startsWith( HOME_PATH_PREFIX ) ||
		path.isAbsolute( sourceString )
	) {
		let sourcePath;
		if ( sourceString.startsWith( HOME_PATH_PREFIX ) ) {
			sourcePath = path.resolve(
				os.homedir(),
				sourceString.slice( HOME_PATH_PREFIX.length )
			);
		} else {
			sourcePath = path.resolve( sourceString );
		}
		const basename = path.basename( sourcePath );
		return {
			type: 'local',
			path: sourcePath,
			basename,
		};
	}

	const zipFields = sourceString.match(
		/^https?:\/\/([^\s$.?#].[^\s]*)\.zip(\?.+)?$/
	);

	if ( zipFields ) {
		const wpOrgFields = sourceString.match(
			/^https?:\/\/downloads\.wordpress\.org\/(?:plugin|theme)\/([^\s\.]*)([^\s]*)?\.zip$/
		);
		const basename = wpOrgFields
			? encodeURIComponent( wpOrgFields[ 1 ] )
			: encodeURIComponent( path.basename( zipFields[ 1 ] ) );

		return {
			type: 'zip',
			url: sourceString,
			path: path.resolve( cacheDirectoryPath, basename ),
			basename,
		};
	}

	// SSH URLs (git)
	const supportedProtocols = [ 'ssh:', 'git+ssh:' ];
	try {
		const sshUrl = new URL( sourceString );
		if ( supportedProtocols.includes( sshUrl.protocol ) ) {
			const pathElements = sshUrl.pathname
				.split( '/' )
				.filter( ( e ) => !! e );
			const basename = pathElements
				.slice( -1 )[ 0 ]
				.replace( /\.git/, '' );
			const workingPath = path.resolve(
				cacheDirectoryPath,
				...pathElements.slice( 0, -1 ),
				basename
			);
			return {
				type: 'git',
				url: sshUrl.href.split( '#' )[ 0 ],
				ref: sshUrl.hash.slice( 1 ) || undefined,
				path: workingPath,
				clonePath: workingPath,
				basename,
			};
		}
	} catch ( err ) {}

	const gitHubFields = sourceString.match(
		/^([^\/]+)\/([^#\/]+)(\/([^#]+))?(?:#(.+))?$/
	);

	if ( gitHubFields ) {
		return {
			type: 'git',
			url: `https://github.com/${ gitHubFields[ 1 ] }/${ gitHubFields[ 2 ] }.git`,
			ref: gitHubFields[ 5 ],
			path: path.resolve(
				cacheDirectoryPath,
				gitHubFields[ 2 ],
				gitHubFields[ 4 ] || '.'
			),
			clonePath: path.resolve( cacheDirectoryPath, gitHubFields[ 2 ] ),
			basename: gitHubFields[ 4 ] || gitHubFields[ 2 ],
		};
	}

	throw new ValidationError(
		`Invalid or unrecognized source: "${ sourceString }".`
	);
}

/**
 * Given a source object, returns a new source object with the testsPath
 * property set correctly. Only the 'core' source requires a testsPath.
 *
 * @param {?WPSource} source                     A source object.
 * @param {Object}    options
 * @param {string}    options.cacheDirectoryPath Path to the work directory located in ~/.wp-env.
 *
 * @return {?WPSource} A source object.
 */
function includeTestsPath( source, { cacheDirectoryPath } ) {
	if ( source === null ) {
		return null;
	}

	return {
		...source,
		testsPath: path.resolve(
			cacheDirectoryPath,
			'tests-' + path.basename( source.path )
		),
	};
}

module.exports = {
	parseSourceString,
	includeTestsPath,
};
