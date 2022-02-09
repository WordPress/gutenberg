/**
 * External dependencies
 */
const chalk = require( 'chalk' );
const { basename, dirname, extname, join, sep } = require( 'path' );
const { sync: glob } = require( 'fast-glob' );

/**
 * Internal dependencies
 */
const {
	getArgsFromCLI,
	getFileArgsFromCLI,
	hasArgInCLI,
	hasFileArgInCLI,
} = require( './cli' );
const { fromConfigRoot, fromProjectRoot, hasProjectFile } = require( './file' );
const { hasPackageProp } = require( './package' );
const { exit } = require( './process' );
const { log } = console;

// See https://babeljs.io/docs/en/config-files#configuration-file-types.
const hasBabelConfig = () =>
	hasProjectFile( '.babelrc.js' ) ||
	hasProjectFile( '.babelrc.json' ) ||
	hasProjectFile( 'babel.config.js' ) ||
	hasProjectFile( 'babel.config.json' ) ||
	hasProjectFile( '.babelrc' ) ||
	hasPackageProp( 'babel' );

// See https://cssnano.co/docs/config-file.
const hasCssnanoConfig = () =>
	hasProjectFile( '.cssnanorc' ) ||
	hasProjectFile( '.cssnanorc.js' ) ||
	hasProjectFile( '.cssnanorc.json' ) ||
	hasProjectFile( '.cssnanorc.yaml' ) ||
	hasProjectFile( '.cssnanorc.yml' ) ||
	hasProjectFile( 'cssnano.config.js' ) ||
	hasPackageProp( 'cssnano' );

/**
 * Returns path to a Jest configuration which should be provided as the explicit
 * configuration when there is none available for discovery by Jest in the
 * project environment. Returns undefined if Jest should be allowed to discover
 * an available configuration.
 *
 * This can be used in cases where multiple possible configurations are
 * supported. Since Jest will only discover `jest.config.js`, or `jest` package
 * directive, such custom configurations must be specified explicitly.
 *
 * @param {"e2e"|"unit"} suffix Suffix of configuration file to accept.
 *
 * @return {string=} Override or fallback configuration file path.
 */
function getJestOverrideConfigFile( suffix ) {
	if ( hasArgInCLI( '-c' ) || hasArgInCLI( '--config' ) ) {
		return;
	}

	if ( hasProjectFile( `jest-${ suffix }.config.js` ) ) {
		return fromProjectRoot( `jest-${ suffix }.config.js` );
	}

	if ( ! hasJestConfig() ) {
		return fromConfigRoot( `jest-${ suffix }.config.js` );
	}
}

// See https://jestjs.io/docs/configuration.
const hasJestConfig = () =>
	hasProjectFile( 'jest.config.js' ) ||
	hasProjectFile( 'jest.config.json' ) ||
	hasProjectFile( 'jest.config.ts' ) ||
	hasPackageProp( 'jest' );

// See https://prettier.io/docs/en/configuration.html.
const hasPrettierConfig = () =>
	hasProjectFile( '.prettierrc.js' ) ||
	hasProjectFile( '.prettierrc.json' ) ||
	hasProjectFile( '.prettierrc.toml' ) ||
	hasProjectFile( '.prettierrc.yaml' ) ||
	hasProjectFile( '.prettierrc.yml' ) ||
	hasProjectFile( 'prettier.config.js' ) ||
	hasProjectFile( '.prettierrc' ) ||
	hasPackageProp( 'prettier' );

const hasWebpackConfig = () =>
	hasArgInCLI( '--config' ) ||
	hasProjectFile( 'webpack.config.js' ) ||
	hasProjectFile( 'webpack.config.babel.js' );

// See https://github.com/michael-ciniawsky/postcss-load-config#usage (used by postcss-loader).
const hasPostCSSConfig = () =>
	hasProjectFile( 'postcss.config.js' ) ||
	hasProjectFile( '.postcssrc' ) ||
	hasProjectFile( '.postcssrc.json' ) ||
	hasProjectFile( '.postcssrc.yaml' ) ||
	hasProjectFile( '.postcssrc.yml' ) ||
	hasProjectFile( '.postcssrc.js' ) ||
	hasPackageProp( 'postcss' );

/**
 * Converts CLI arguments to the format which webpack understands.
 *
 * @see https://webpack.js.org/api/cli/#usage-with-config-file
 *
 * @return {Array} The list of CLI arguments to pass to webpack CLI.
 */
const getWebpackArgs = () => {
	// Gets all args from CLI without those prefixed with `--webpack`.
	let webpackArgs = getArgsFromCLI( [ '--webpack' ] );

	const hasWebpackOutputOption =
		hasArgInCLI( '-o' ) || hasArgInCLI( '--output' );
	if (
		! hasWebpackOutputOption &&
		! hasArgInCLI( '--entry' ) &&
		hasFileArgInCLI()
	) {
		/**
		 * Converts a legacy path to the entry pair supported by webpack, e.g.:
		 * `./entry-one.js` -> `[ 'entry-one', './entry-one.js] ]`
		 * `entry-two.js` -> `[ 'entry-two', './entry-two.js' ]`
		 *
		 * @param {string} path The path provided.
		 *
		 * @return {string[]} The entry pair of its name and the file path.
		 */
		const pathToEntry = ( path ) => {
			const entryName = basename( path, '.js' );

			if ( ! path.startsWith( './' ) ) {
				path = './' + path;
			}

			return [ entryName, path ];
		};

		const fileArgs = getFileArgsFromCLI();
		if ( fileArgs.length > 0 ) {
			// Filters out all CLI arguments that are recognized as file paths.
			const fileArgsToRemove = new Set( fileArgs );
			webpackArgs = webpackArgs.filter( ( cliArg ) => {
				if ( fileArgsToRemove.has( cliArg ) ) {
					fileArgsToRemove.delete( cliArg );
					return false;
				}
				return true;
			} );

			// Converts all CLI arguments that are file paths to the `entry` format supported by webpack.
			// It is going to be consumed in the config through the WP_ENTRY global variable.
			const entry = {};
			fileArgs.forEach( ( fileArg ) => {
				const [ entryName, path ] = fileArg.includes( '=' )
					? fileArg.split( '=' )
					: pathToEntry( fileArg );
				entry[ entryName ] = path;
			} );
			process.env.WP_ENTRY = JSON.stringify( entry );
		}
	}

	if ( ! hasWebpackConfig() ) {
		webpackArgs.push( '--config', fromConfigRoot( 'webpack.config.js' ) );
	}

	return webpackArgs;
};

/**
 * Detects the list of entry points to use with webpack. There are three ways to do this:
 *  1. Use the legacy webpack 4 format passed as CLI arguments.
 *  2. Scan `block.json` files for scripts.
 *  3. Fallback to `src/index.*` file.
 *
 * @see https://webpack.js.org/concepts/entry-points/
 *
 * @return {Object<string,string>} The list of entry points.
 */
function getWebpackEntryPoints() {
	// 1. Handles the legacy format for entry points when explicitly provided with the `process.env.WP_ENTRY`.
	if ( process.env.WP_ENTRY ) {
		return JSON.parse( process.env.WP_ENTRY );
	}

	// 2. Checks whether any block metadata files can be detected in the `src` directory.
	//    It scans all discovered files looking for JavaScript assets and converts them to entry points.
	const blockMetadataFiles = glob( 'src/**/block.json', {
		absolute: true,
	} );

	if ( blockMetadataFiles.length > 0 ) {
		const srcDirectory = fromProjectRoot( 'src' + sep );
		const entryPoints = blockMetadataFiles.reduce(
			( accumulator, blockMetadataFile ) => {
				const {
					editorScript,
					script,
					viewScript,
				} = require( blockMetadataFile );
				[ editorScript, script, viewScript ]
					.flat()
					.filter( ( value ) => value && value.startsWith( 'file:' ) )
					.forEach( ( value ) => {
						// Removes the `file:` prefix.
						const filepath = join(
							dirname( blockMetadataFile ),
							value.replace( 'file:', '' )
						);

						// Takes the path without the file extension, and relative to the `src` directory.
						if ( ! filepath.startsWith( srcDirectory ) ) {
							log(
								chalk.yellow(
									`Skipping "${ value.replace(
										'file:',
										''
									) }" listed in "${ blockMetadataFile.replace(
										fromProjectRoot( sep ),
										''
									) }". File is located outside of the "src" directory.`
								)
							);
							return;
						}
						const entryName = filepath
							.replace( extname( filepath ), '' )
							.replace( srcDirectory, '' );

						// Detects the proper file extension used in the `src` directory.
						const [ entryFilepath ] = glob(
							`src/${ entryName }.[jt]s?(x)`,
							{
								absolute: true,
							}
						);

						if ( ! entryFilepath ) {
							log(
								chalk.yellow(
									`Skipping "${ value.replace(
										'file:',
										''
									) }" listed in "${ blockMetadataFile.replace(
										fromProjectRoot( sep ),
										''
									) }". File does not exist in the "src" directory.`
								)
							);
							return;
						}
						accumulator[ entryName ] = entryFilepath;
					} );
				return accumulator;
			},
			{}
		);

		if ( Object.keys( entryPoints ).length > 0 ) {
			return entryPoints;
		}
	}

	// 3. Checks whether a standard file name can be detected in the `src` directory,
	//    and converts the discovered file to entry point.
	const [ entryFile ] = glob( 'src/index.[jt]s?(x)', {
		absolute: true,
	} );
	if ( ! entryFile ) {
		log(
			chalk.bold.red( 'No entry files discovered in the "src" folder.' )
		);
		exit( 1 );
	}

	return {
		index: entryFile,
	};
}

module.exports = {
	getJestOverrideConfigFile,
	getWebpackArgs,
	getWebpackEntryPoints,
	hasBabelConfig,
	hasCssnanoConfig,
	hasJestConfig,
	hasPostCSSConfig,
	hasPrettierConfig,
};
