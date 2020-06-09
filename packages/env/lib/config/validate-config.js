'use strict';
/**
 * External dependencies
 */
const path = require( 'path' );
const os = require( 'os' );

/**
 * @typedef {import('./config').WPServiceConfig} WPServiceConfig
 * @typedef {import('./config').WPSource} WPSource
 */

/**
 * Error subtype which indicates that an expected validation erorr occured
 * while reading wp-env configuration.
 */
class ValidationError extends Error {}

/**
 * The string at the beginning of a source path that points to a home-relative
 * directory. Will be '~/' on unix environments and '~\' on Windows.
 */
const HOME_PATH_PREFIX = `~${ path.sep }`;

/**
 * Parses and validates a config object.
 *
 * @param {Object} config A raw config object to parse
 * @param {Object} options
 * @param {string} options.workDirectoryPath Path to the work directory located in ~/.wp-env.
 * @param {string} options.environment Environment name for the service we are parsing.
 * @return {WPServiceConfig} validated and parsed service-level configuration.
 */
function validateConfig( config, options ) {
	if ( config.core !== null && typeof config.core !== 'string' ) {
		throw new ValidationError(
			'Invalid .wp-env.json: "core" must be null or a string.'
		);
	}

	if (
		! Array.isArray( config.plugins ) ||
		config.plugins.some( ( plugin ) => typeof plugin !== 'string' )
	) {
		throw new ValidationError(
			'Invalid .wp-env.json: "plugins" must be an array of strings.'
		);
	}

	if (
		! Array.isArray( config.themes ) ||
		config.themes.some( ( theme ) => typeof theme !== 'string' )
	) {
		throw new ValidationError(
			'Invalid .wp-env.json: "themes" must be an array of strings.'
		);
	}

	if ( ! Number.isInteger( config.port ) ) {
		throw new ValidationError(
			'Invalid .wp-env.json: "port" must be an integer.'
		);
	}

	if ( typeof config.config !== 'object' ) {
		throw new ValidationError(
			'Invalid .wp-env.json: "config" must be an object.'
		);
	}

	if ( typeof config.mappings !== 'object' ) {
		throw new ValidationError(
			'Invalid .wp-env.json: "mappings" must be an object.'
		);
	}

	for ( const [ wpDir, localDir ] of Object.entries( config.mappings ) ) {
		if ( ! localDir || typeof localDir !== 'string' ) {
			throw new ValidationError(
				`Invalid .wp-env.json: "mapping.${ wpDir }" should be a string.`
			);
		}
	}

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
}

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

	const gitHubFields = sourceString.match( /^([^\/]+)\/([^#]+)(?:#(.+))?$/ );
	if ( gitHubFields ) {
		return {
			type: 'git',
			url: `https://github.com/${ gitHubFields[ 1 ] }/${ gitHubFields[ 2 ] }.git`,
			ref: gitHubFields[ 3 ] || 'master',
			path: path.resolve( workDirectoryPath, gitHubFields[ 2 ] ),
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

module.exports = {
	validateConfig,
	ValidationError,
};
