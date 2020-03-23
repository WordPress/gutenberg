/**
 * External dependencies
 */
const { createHash } = require( 'crypto' );
const json2php = require( 'json2php' );
const path = require( 'path' );
const { ExternalsPlugin } = require( 'webpack' );
const { RawSource } = require( 'webpack-sources' );

/**
 * Internal dependencies
 */
const {
	defaultRequestToExternal,
	defaultRequestToHandle,
} = require( './util' );

class DependencyExtractionWebpackPlugin {
	constructor( options ) {
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

		// Track requests that are externalized.
		//
		// Because we don't have a closed set of dependencies, we need to track what has
		// been externalized so we can recognize them in a later phase when the dependency
		// lists are generated.
		this.externalizedDeps = new Set();

		// Offload externalization work to the ExternalsPlugin.
		this.externalsPlugin = new ExternalsPlugin(
			'this',
			this.externalizeWpDeps.bind( this )
		);
	}

	externalizeWpDeps( context, request, callback ) {
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

			return callback( null, { this: externalRequest } );
		}

		return callback();
	}

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

	stringify( asset ) {
		if ( this.options.outputFormat === 'php' ) {
			return `<?php return ${ json2php(
				JSON.parse( JSON.stringify( asset ) )
			) };`;
		}

		return JSON.stringify( asset );
	}

	apply( compiler ) {
		this.externalsPlugin.apply( compiler );

		const { output } = compiler.options;
		const { filename: outputFilename } = output;

		compiler.hooks.emit.tap( this.constructor.name, ( compilation ) => {
			const {
				combineAssets,
				combinedOutputFile,
				injectPolyfill,
				outputFormat,
			} = this.options;
			const combinedAssetsData = {};

			// Process each entry point independently.
			for ( const [
				entrypointName,
				entrypoint,
			] of compilation.entrypoints.entries() ) {
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
				const outputFolder = compiler.options.output.path;
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

function basename( name ) {
	if ( ! name.includes( '/' ) ) {
		return name;
	}
	return name.substr( name.lastIndexOf( '/' ) + 1 );
}

module.exports = DependencyExtractionWebpackPlugin;
