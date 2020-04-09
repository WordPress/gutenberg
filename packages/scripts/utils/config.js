/**
 * External dependencies
 */
const { basename } = require( 'path' );

/**
 * WordPress dependencies
 */
const {
	getArgsFromCLI,
	getFileArgsFromCLI,
	hasArgInCLI,
	hasFileArgInCLI,
	hasPackageProp,
	hasProjectFile,
} = require( '@wordpress/scripts-utils' );

/**
 * Internal dependencies
 */
const { fromConfigRoot } = require( '../utils' );

/**
 * @see https://babeljs.io/docs/en/config-files#configuration-file-types
 */
const hasBabelConfig = () =>
	hasProjectFile( '.babelrc' ) ||
	hasProjectFile( '.babelrc.cjs' ) ||
	hasProjectFile( '.babelrc.js' ) ||
	hasProjectFile( '.babelrc.json' ) ||
	hasProjectFile( '.babelrc.mjs' ) ||
	hasProjectFile( 'babel.config.cjs' ) ||
	hasProjectFile( 'babel.config.js' ) ||
	hasProjectFile( 'babel.config.json' ) ||
	hasProjectFile( 'babel.config.mjs' ) ||
	hasPackageProp( 'babel' );

/**
 * @see https://jestjs.io/docs/en/configuration
 */
const hasJestConfig = () =>
	hasArgInCLI( '-c' ) ||
	hasArgInCLI( '--config' ) ||
	hasProjectFile( 'jest.config.cjs' ) ||
	hasProjectFile( 'jest.config.js' ) ||
	hasProjectFile( 'jest.config.json' ) ||
	hasProjectFile( 'jest.config.mjs' ) ||
	hasPackageProp( 'jest' );

/**
 * @see https://prettier.io/docs/en/configuration.html
 */
const hasPrettierConfig = () =>
	hasProjectFile( '.prettierrc' ) ||
	hasProjectFile( '.prettierrc.js' ) ||
	hasProjectFile( '.prettierrc.json' ) ||
	hasProjectFile( '.prettierrc.toml' ) ||
	hasProjectFile( '.prettierrc.yaml' ) ||
	hasProjectFile( '.prettierrc.yml' ) ||
	hasProjectFile( 'prettier.config.js' ) ||
	hasPackageProp( 'prettier' );

const hasWebpackConfig = () =>
	hasArgInCLI( '--config' ) ||
	hasProjectFile( 'webpack.config.js' ) ||
	hasProjectFile( 'webpack.config.babel.js' );

/**
 * Converts CLI arguments to the format which webpack understands.
 * It allows to optionally pass some additional webpack CLI arguments.
 *
 * @see https://webpack.js.org/api/cli/#usage-with-config-file
 *
 * @param {?Array} additionalArgs The list of additional CLI arguments.
 *
 * @return {Array} The list of CLI arguments to pass to webpack CLI.
 */
const getWebpackArgs = ( additionalArgs = [] ) => {
	let webpackArgs = getArgsFromCLI();

	const hasWebpackOutputOption =
		hasArgInCLI( '-o' ) || hasArgInCLI( '--output' );
	if ( hasFileArgInCLI() && ! hasWebpackOutputOption ) {
		/**
		 * Converts a path to the entry format supported by webpack, e.g.:
		 * `./entry-one.js` -> `entry-one=./entry-one.js`
		 * `entry-two.js` -> `entry-two=./entry-two.js`
		 *
		 * @param {string} path The path provided.
		 *
		 * @return {string} The entry format supported by webpack.
		 */
		const pathToEntry = ( path ) => {
			const entry = basename( path, '.js' );

			if ( ! path.startsWith( './' ) ) {
				path = './' + path;
			}

			return [ entry, path ].join( '=' );
		};

		// The following handles the support for multiple entry points in webpack, e.g.:
		// `wp-scripts build one.js custom=./two.js` -> `webpack one=./one.js custom=./two.js`
		webpackArgs = webpackArgs.map( ( cliArg ) => {
			if (
				getFileArgsFromCLI().includes( cliArg ) &&
				! cliArg.includes( '=' )
			) {
				return pathToEntry( cliArg );
			}

			return cliArg;
		} );
	}

	if ( ! hasWebpackConfig() ) {
		webpackArgs.push( '--config', fromConfigRoot( 'webpack.config.js' ) );
	}

	webpackArgs.push( ...additionalArgs );

	return webpackArgs;
};

module.exports = {
	getWebpackArgs,
	hasBabelConfig,
	hasJestConfig,
	hasPrettierConfig,
};
