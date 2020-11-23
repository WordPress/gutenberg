/**
 * External dependencies
 */
const { createHash } = require( 'crypto' );
const path = require( 'path' );
const { ExternalsPlugin } = require( 'webpack' );
const { RawSource } = require( 'webpack-sources' );
// Ignore reason: json2php is untyped
// @ts-ignore
const json2php = require( 'json2php' );

/**
 * Internal dependencies
 */
const {
	defaultRequestToExternal,
	defaultRequestToHandle,
} = require( './util' );

/**
 * Map module request to an external.
 *
 * @callback RequestToExternal
 *
 * @param {string} request Module request.
 *
 * @return {string|string[]|void} Return `undefined` to ignore the request.
 *                                     Return `string|string[]` to map the request to an external.
 */

/**
 * Map module request to a script handle.
 *
 * @callback RequestToHandle
 *
 * @param {string} request Module request.
 *
 * @return {string|void} Return `undefined` to use the same name as the module.
 *                            Return `string` to map the request to a specific script handle.
 */

/**
 * @typedef AssetData
 *
 * @property {string}   version      String representing a particular build
 * @property {string[]} dependencies The script dependencies
 */

/**
 * @typedef Options
 *
 * @property {boolean}                     injectPolyfill      Force wp-polyfill to be included in each entry point's dependency list. This is like importing `@wordpress/polyfill` for each entry point.
 * @property {boolean}                     useDefaults         Set to `false` to disable the default WordPress script request handling.
 * @property {'php'|'json'}                outputFormat        The output format for the generated asset file.
 * @property {RequestToExternal|undefined} [requestToExternal] Map module requests to an external.
 * @property {RequestToHandle|undefined}   [requestToHandle]   Map module requests to a script handle.
 * @property {string|null}                 combinedOutputFile  This option is useful only when the combineAssets option is enabled. It allows providing a custom output file for the generated single assets file. It's possible to provide a path that is relative to the output directory.
 * @property {boolean|undefined}           combineAssets       By default, one asset file is created for each entry point. When this flag is set to true, all information about assets is combined into a single assets.(json|php) file generated in the output directory.
 */

class DependencyExtractionWebpackPlugin {
	/**
	 * @param {Partial<Options>} options
	 */
	constructor( options ) {
		/** @type {Options} */
		this.options = Object.assign(
			{
				combineAssets: false,
				combinedOutputFile: null,
				injectPolyfill: false,
				outputFormat: 'php',
				useDefaults: true,
			},
			options
		);

		/**
		 * Track requests that are externalized.
		 *
		 * Because we don't have a closed set of dependencies, we need to track what has
		 * been externalized so we can recognize them in a later phase when the dependency
		 * lists are generated.
		 *
		 * @type {Set<string>}
		 */
		this.externalizedDeps = new Set();

		// Offload externalization work to the ExternalsPlugin.
		this.externalsPlugin = new ExternalsPlugin(
			'window',
			this.externalizeWpDeps.bind( this )
		);
	}

	/* eslint-disable jsdoc/valid-types */
	/**
	 * @param {Parameters<WebpackExternalsFunction>[0]} _context
	 * @param {Parameters<WebpackExternalsFunction>[1]} request
	 * @param {Parameters<WebpackExternalsFunction>[2]} callback
	 */
	externalizeWpDeps( _context, request, callback ) {
		/* eslint-enable jsdoc/valid-types */
		let externalRequest;

		// Handle via options.requestToExternal first
		if ( typeof this.options.requestToExternal === 'function' ) {
			externalRequest = this.options.requestToExternal( request );
		}

		// Cascade to default if unhandled and enabled
		if (
			typeof externalRequest === 'undefined' &&
			this.options.useDefaults
		) {
			externalRequest = defaultRequestToExternal( request );
		}

		if ( externalRequest ) {
			this.externalizedDeps.add( request );

			return callback( null, externalRequest );
		}

		return callback();
	}

	/**
	 * @param {string} request
	 * @return {string} Transformed request
	 */
	mapRequestToDependency( request ) {
		// Handle via options.requestToHandle first
		if ( typeof this.options.requestToHandle === 'function' ) {
			const scriptDependency = this.options.requestToHandle( request );
			if ( scriptDependency ) {
				return scriptDependency;
			}
		}

		// Cascade to default if enabled
		if ( this.options.useDefaults ) {
			const scriptDependency = defaultRequestToHandle( request );
			if ( scriptDependency ) {
				return scriptDependency;
			}
		}

		// Fall back to the request name
		return request;
	}

	/**
	 * @param {Object} asset
	 * @return {string} Stringified asset
	 */
	stringify( asset ) {
		if ( this.options.outputFormat === 'php' ) {
			return `<?php return ${ json2php(
				JSON.parse( JSON.stringify( asset ) )
			) };`;
		}

		return JSON.stringify( asset );
	}

	/**
	 * @param {WebpackCompiler} compiler
	 * @return {void}
	 */
	apply( compiler ) {
		this.externalsPlugin.apply( compiler );

		// Assert the `string` type for output filename.
		// The type indicates the option may be `undefined`.
		// However, at this point in compilation, webpack has filled the options in if
		// they were not provided.
		const outputFilename = /** @type {{filename:string}} */ ( compiler
			.options.output ).filename;

		compiler.hooks.emit.tap( this.constructor.name, ( compilation ) => {
			const {
				combineAssets,
				combinedOutputFile,
				injectPolyfill,
				outputFormat,
			} = this.options;

			/** @type {Record<string, AssetData>} */
			const combinedAssetsData = {};

			// Process each entry point independently.
			for ( const [
				entrypointName,
				entrypoint,
			] of compilation.entrypoints.entries() ) {
				/** @type {Set<string>} */
				const entrypointExternalizedWpDeps = new Set();
				if ( injectPolyfill ) {
					entrypointExternalizedWpDeps.add( 'wp-polyfill' );
				}

				// Search for externalized modules in all chunks.
				for ( const chunk of entrypoint.chunks ) {
					for ( const { userRequest } of chunk.modulesIterable ) {
						if ( this.externalizedDeps.has( userRequest ) ) {
							const scriptDependency = this.mapRequestToDependency(
								userRequest
							);
							entrypointExternalizedWpDeps.add(
								scriptDependency
							);
						}
					}
				}

				const runtimeChunk = entrypoint.getRuntimeChunk();

				/** @type {AssetData} */
				const assetData = {
					// Get a sorted array so we can produce a stable, stringified representation.
					dependencies: Array.from(
						entrypointExternalizedWpDeps
					).sort(),
					version: runtimeChunk.hash,
				};

				const assetString = this.stringify( assetData );

				// Determine a filename for the asset file.
				const [ filename, query ] = entrypointName.split( '?', 2 );
				const buildFilename = compilation.getPath( outputFilename, {
					chunk: runtimeChunk,
					filename,
					query,
					basename: basename( filename ),
					contentHash: createHash( 'md4' )
						.update( assetString )
						.digest( 'hex' ),
				} );

				if ( combineAssets ) {
					combinedAssetsData[ buildFilename ] = assetData;
					continue;
				}

				const assetFilename = buildFilename.replace(
					/\.js$/i,
					'.asset.' + ( outputFormat === 'php' ? 'php' : 'json' )
				);

				// Add source and file into compilation for webpack to output.
				compilation.assets[ assetFilename ] = new RawSource(
					assetString
				);
				runtimeChunk.files.push( assetFilename );
			}

			if ( combineAssets ) {
				// Assert the `string` type for output path.
				// The type indicates the option may be `undefined`.
				// However, at this point in compilation, webpack has filled the options in if
				// they were not provided.
				const outputFolder = /** @type {{path:string}} */ ( compiler
					.options.output ).path;

				const assetsFilePath = path.resolve(
					outputFolder,
					combinedOutputFile ||
						'assets.' + ( outputFormat === 'php' ? 'php' : 'json' )
				);
				const assetsFilename = path.relative(
					outputFolder,
					assetsFilePath
				);

				// Add source into compilation for webpack to output.
				compilation.assets[ assetsFilename ] = new RawSource(
					this.stringify( combinedAssetsData )
				);
			}
		} );
	}
}

/**
 * @param {string} name
 * @return {string} Basename
 */
function basename( name ) {
	if ( ! name.includes( '/' ) ) {
		return name;
	}
	return name.substr( name.lastIndexOf( '/' ) + 1 );
}

module.exports = DependencyExtractionWebpackPlugin;

/**
 * @typedef {import('webpack').Compiler} WebpackCompiler
 * @typedef {import('webpack').ExternalsFunctionElement} WebpackExternalsFunction
 */
