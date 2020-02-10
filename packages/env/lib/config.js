'use strict';
/**
 * External dependencies
 */
const fs = require( 'fs' ).promises;
const path = require( 'path' );
const os = require( 'os' );
const crypto = require( 'crypto' );

/**
 * Internal dependencies
 */
const detectDirectoryType = require( './detect-directory-type' );

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
 * A wp-env config object.
 *
 * @typedef Config
 * @property {string} name Name of the environment.
 * @property {string} configDirectoryPath Path to the .wp-env.json file.
 * @property {string} workDirectoryPath Path to the work directory located in ~/.wp-env.
 * @property {string} dockerComposeConfigPath Path to the docker-compose.yml file.
 * @property {Source|null} coreSource The WordPress installation to load in the environment.
 * @property {Source[]} pluginSources Plugins to load in the environment.
 * @property {Source[]} themeSources Themes to load in the environment.
 */

/**
 * A WordPress installation, plugin or theme to be loaded into the environment.
 *
 * @typedef Source
 * @property {string} type The source type. Can be 'local' or 'git'.
 * @property {string} path The path to the WordPress installation, plugin or theme.
 * @property {string} basename Name that identifies the WordPress installation, plugin or theme.
 */

module.exports = {
	ValidationError,

	/**
	 * Reads and parses the given .wp-env.json file into a wp-env config object.
	 *
	 * @param {string} configPath Path to the .wp-env.json file.
	 * @return {Config} A wp-env config object.
	 */
	async readConfig( configPath ) {
		const configDirectoryPath = path.dirname( configPath );

		let config = null;

		try {
			config = JSON.parse( await fs.readFile( configPath, 'utf8' ) );
		} catch ( error ) {
			if ( error.code === 'ENOENT' ) {
				// Config file does not exist. Do nothing - it's optional.
			} else if ( error instanceof SyntaxError ) {
				throw new ValidationError(
					`Invalid .wp-env.json: ${ error.message }`
				);
			} else {
				throw new ValidationError(
					`Could not read .wp-env.json: ${ error.message }`
				);
			}
		}

		if ( config === null ) {
			const type = await detectDirectoryType( configDirectoryPath );
			if ( type === 'core' ) {
				config = { core: '.' };
			} else if ( type === 'plugin' ) {
				config = { plugins: [ '.' ] };
			} else if ( type === 'theme' ) {
				config = { themes: [ '.' ] };
			} else {
				throw new ValidationError(
					`No .wp-env.json file found at '${ configPath }' and could not determine if '${ configDirectoryPath }' is a WordPress installation, a plugin, or a theme.`
				);
			}
		}

		config = Object.assign(
			{
				core: null,
				plugins: [],
				themes: [],
			},
			config
		);

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

		const workDirectoryPath = path.resolve(
			os.homedir(),
			'.wp-env',
			md5( configPath )
		);

		return {
			name: path.basename( configDirectoryPath ),
			configDirectoryPath,
			workDirectoryPath,
			dockerComposeConfigPath: path.resolve(
				workDirectoryPath,
				'docker-compose.yml'
			),
			coreSource: includeTestsPath(
				parseSourceString( config.core, {
					workDirectoryPath,
				} )
			),
			pluginSources: config.plugins.map( ( sourceString ) =>
				parseSourceString( sourceString, {
					workDirectoryPath,
				} )
			),
			themeSources: config.themes.map( ( sourceString ) =>
				parseSourceString( sourceString, {
					workDirectoryPath,
				} )
			),
		};
	},
};

/**
 * Parses a source string into a source object.
 *
 * @param {string|null} sourceString The source string. See README.md for documentation on valid source string patterns.
 * @param {Object} options
 * @param {boolean} options.hasTests Whether or not a `testsPath` is required. Only the 'core' source needs this.
 * @param {string} options.workDirectoryPath Path to the work directory located in ~/.wp-env.
 * @return {Source|null} A source object.
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
 * @param {Source|null} source A source object.
 * @return {Source|null} A source object.
 */
function includeTestsPath( source ) {
	if ( source === null ) {
		return null;
	}

	return {
		...source,
		testsPath: path.resolve(
			source.path,
			'..',
			'tests-' + path.basename( source.path )
		),
	};
}

/**
 * Hashes the given string using the MD5 algorithm.
 *
 * @param {string} data The string to hash.
 * @return {string} An MD5 hash string.
 */
function md5( data ) {
	return crypto
		.createHash( 'md5' )
		.update( data )
		.digest( 'hex' );
}
