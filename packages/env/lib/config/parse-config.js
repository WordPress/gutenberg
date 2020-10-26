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
 * @typedef {import('./config').WPServiceConfig} WPServiceConfig
 * @typedef {import('./config').WPSource} WPSource
 */

/**
 * The string at the beginning of a source path that points to a home-relative
 * directory. Will be '~/' on unix environments and '~\' on Windows.
 */
const HOME_PATH_PREFIX = `~${ path.sep }`;

/**
 * Parses a config object. Takes environment-level configuration in the format
 * specified in .wp-env.json, validates it, and converts it into the format used
 * internally. For example, `plugins: string[]` will be parsed into
 * `pluginSources: WPSource[]`.
 *
 * @param {Object} config A config object to validate.
 * @param {Object} options
 * @param {string} options.workDirectoryPath Path to the work directory located in ~/.wp-env.
 * @return {WPServiceConfig} Parsed environment-level configuration.
 */
module.exports = function parseConfig( config, options ) {
	return {
		port: config.port,
		coreSource: includeTestsPath(
			parseSourceString( config.core, options ),
			options
		),
		pluginSources: config.plugins.map( ( sourceString ) =>
			parseSourceString( sourceString, options )
		),
		themeSources: config.themes.map( ( sourceString ) =>
			parseSourceString( sourceString, options )
		),
		config: config.config,
		mappings: Object.entries( config.mappings ).reduce(
			( result, [ wpDir, localDir ] ) => {
				const source = parseSourceString( localDir, options );
				result[ wpDir ] = source;
				return result;
			},
			{}
		),
	};
};

/**
 * Parses a source string into a source object.
 *
 * @param {?string} sourceString The source string. See README.md for documentation on valid source string patterns.
 * @param {Object} options
 * @param {string} options.workDirectoryPath Path to the work directory located in ~/.wp-env.
 *
 * @return {?WPSource} A source object.
 */
function parseSourceString( sourceString, { workDirectoryPath } ) {
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
		/^https?:\/\/([^\s$.?#].[^\s]*)\.zip$/
	);

	if ( zipFields ) {
		const wpOrgFields = sourceString.match(
			/^https?:\/\/downloads\.wordpress\.org\/(?:plugin|theme)\/([^\s\.]*)([^\s]*)?\.zip$/
		);
		const basename = wpOrgFields
			? encodeURIComponent( wpOrgFields[ 1 ] )
			: encodeURIComponent( zipFields[ 1 ] );
		return {
			type: 'zip',
			url: sourceString,
			path: path.resolve( workDirectoryPath, basename ),
			basename,
		};
	}

	const gitHubFields = sourceString.match(
		/^([^\/]+)\/([^#\/]+)(\/([^#]+))?(?:#(.+))?$/
	);
	if ( gitHubFields ) {
		return {
			type: 'git',
			url: `https://github.com/${ gitHubFields[ 1 ] }/${ gitHubFields[ 2 ] }.git`,
			ref: gitHubFields[ 5 ] || 'master',
			path: path.resolve(
				workDirectoryPath,
				gitHubFields[ 2 ],
				gitHubFields[ 4 ] || '.'
			),
			clonePath: path.resolve( workDirectoryPath, gitHubFields[ 2 ] ),
			basename: gitHubFields[ 2 ],
		};
	}

	throw new ValidationError(
		`Invalid or unrecognized source: "${ sourceString }."`
	);
}

/**
 * Given a source object, returns a new source object with the testsPath
 * property set correctly. Only the 'core' source requires a testsPath.
 *
 * @param {?WPSource} source                    A source object.
 * @param {Object}  options
 * @param {string}  options.workDirectoryPath Path to the work directory located in ~/.wp-env.
 *
 * @return {?WPSource} A source object.
 */
function includeTestsPath( source, { workDirectoryPath } ) {
	if ( source === null ) {
		return null;
	}

	return {
		...source,
		testsPath: path.resolve(
			workDirectoryPath,
			'tests-' + path.basename( source.path )
		),
	};
}
