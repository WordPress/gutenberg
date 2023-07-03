/**
 * External dependencies
 */
const path = require( 'path' );
const webpack = require( 'webpack' );
// In webpack 5 there is a `webpack.sources` field but for webpack 4 we have to fallback to the `webpack-sources` package.
const { RawSource } = webpack.sources || require( 'webpack-sources' );
const json2php = require( 'json2php' );
const isWebpack4 = webpack.version.startsWith( '4.' );
const { createHash } = webpack.util;

/**
 * Internal dependencies
 */
const {
	defaultRequestToExternal,
	defaultRequestToHandle,
} = require( './util' );

const defaultExternalizedReportFileName = 'externalized-dependencies.json';

class DependencyExtractionWebpackPlugin {
	constructor( options ) {
		this.options = Object.assign(
			{
				combineAssets: false,
				combinedOutputFile: null,
				externalizedReport: false,
				injectPolyfill: false,
				outputFormat: 'php',
				outputFilename: null,
				useDefaults: true,
			},
			options
		);

		/*
		 * Track requests that are externalized.
		 *
		 * Because we don't have a closed set of dependencies, we need to track what has
		 * been externalized so we can recognize them in a later phase when the dependency
		 * lists are generated.
		 */
		this.externalizedDeps = new Set();

		// Offload externalization work to the ExternalsPlugin.
		this.externalsPlugin = new webpack.ExternalsPlugin(
			'window',
			isWebpack4
				? this.externalizeWpDeps.bind( this )
				: this.externalizeWpDepsV5.bind( this )
		);
	}

	externalizeWpDeps( _context, request, callback ) {
		let externalRequest;

		// Handle via options.requestToExternal first.
		if ( typeof this.options.requestToExternal === 'function' ) {
			externalRequest = this.options.requestToExternal( request );
		}

		// Cascade to default if unhandled and enabled.
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

	externalizeWpDepsV5( { context, request }, callback ) {
		return this.externalizeWpDeps( context, request, callback );
	}

	mapRequestToDependency( request ) {
		// Handle via options.requestToHandle first.
		if ( typeof this.options.requestToHandle === 'function' ) {
			const scriptDependency = this.options.requestToHandle( request );
			if ( scriptDependency ) {
				return scriptDependency;
			}
		}

		// Cascade to default if enabled.
		if ( this.options.useDefaults ) {
			const scriptDependency = defaultRequestToHandle( request );
			if ( scriptDependency ) {
				return scriptDependency;
			}
		}

		// Fall back to the request name.
		return request;
	}

	stringify( asset ) {
		if ( this.options.outputFormat === 'php' ) {
			return `<?php return ${ json2php(
				JSON.parse( JSON.stringify( asset ) )
			) };\n`;
		}

		return JSON.stringify( asset );
	}

	apply( compiler ) {
		this.externalsPlugin.apply( compiler );

		if ( isWebpack4 ) {
			compiler.hooks.emit.tap( this.constructor.name, ( compilation ) =>
				this.addAssets( compilation )
			);
		} else {
			compiler.hooks.thisCompilation.tap(
				this.constructor.name,
				( compilation ) => {
					compilation.hooks.processAssets.tap(
						{
							name: this.constructor.name,
							stage: compiler.webpack.Compilation
								.PROCESS_ASSETS_STAGE_ANALYSE,
						},
						() => this.addAssets( compilation )
					);
				}
			);
		}
	}

	addAssets( compilation ) {
		const {
			combineAssets,
			combinedOutputFile,
			externalizedReport,
			injectPolyfill,
			outputFormat,
			outputFilename,
		} = this.options;

		// Dump actually externalized dependencies to a report file.
		if ( externalizedReport ) {
			const externalizedReportFile =
				typeof externalizedReport === 'string'
					? externalizedReport
					: defaultExternalizedReportFileName;
			compilation.emitAsset(
				externalizedReportFile,
				new RawSource(
					JSON.stringify( Array.from( this.externalizedDeps ).sort() )
				)
			);
		}

		const combinedAssetsData = {};

		// Accumulate all entrypoint chunks, some of them shared
		const entrypointChunks = new Set();
		for ( const entrypoint of compilation.entrypoints.values() ) {
			for ( const chunk of entrypoint.chunks ) {
				entrypointChunks.add( chunk );
			}
		}

		// Process each entrypoint chunk independently
		for ( const chunk of entrypointChunks ) {
			const chunkFiles = Array.from( chunk.files );

			const chunkJSFile = chunkFiles.find( ( f ) => /\.js$/i.test( f ) );
			if ( ! chunkJSFile ) {
				// There's no JS file in this chunk, no work for us. Typically a `style.css` from cache group.
				continue;
			}

			const chunkDeps = new Set();
			if ( injectPolyfill ) {
				chunkDeps.add( 'wp-polyfill' );
			}

			const processModule = ( { userRequest } ) => {
				if ( this.externalizedDeps.has( userRequest ) ) {
					chunkDeps.add( this.mapRequestToDependency( userRequest ) );
				}
			};

			// Search for externalized modules in all chunks.
			const modulesIterable = isWebpack4
				? chunk.modulesIterable
				: compilation.chunkGraph.getChunkModules( chunk );
			for ( const chunkModule of modulesIterable ) {
				processModule( chunkModule );
				// Loop through submodules of ConcatenatedModule.
				if ( chunkModule.modules ) {
					for ( const concatModule of chunkModule.modules ) {
						processModule( concatModule );
					}
				}
			}

			// Go through the assets and hash the sources. We can't just use
			// `chunk.contentHash` because that's not updated when
			// assets are minified. In practice the hash is updated by
			// `RealContentHashPlugin` after minification, but it only modifies
			// already-produced asset filenames and the updated hash is not
			// available to plugins.
			const { hashFunction, hashDigest, hashDigestLength } =
				compilation.outputOptions;

			const contentHash = chunkFiles
				.sort()
				.reduce( ( hash, filename ) => {
					const asset = compilation.getAsset( filename );
					return hash.update( asset.source.buffer() );
				}, createHash( hashFunction ) )
				.digest( hashDigest )
				.slice( 0, hashDigestLength );

			const assetData = {
				// Get a sorted array so we can produce a stable, stringified representation.
				dependencies: Array.from( chunkDeps ).sort(),
				version: contentHash,
			};

			if ( combineAssets ) {
				combinedAssetsData[ chunkJSFile ] = assetData;
				continue;
			}

			let assetFilename;
			if ( outputFilename ) {
				assetFilename = compilation.getPath( outputFilename, {
					chunk,
					filename: chunkJSFile,
					contentHash,
				} );
			} else {
				const suffix =
					'.asset.' + ( outputFormat === 'php' ? 'php' : 'json' );
				assetFilename = compilation
					.getPath( '[file]', { filename: chunkJSFile } )
					.replace( /\.js$/i, suffix );
			}

			// Add source and file into compilation for webpack to output.
			compilation.assets[ assetFilename ] = new RawSource(
				this.stringify( assetData )
			);
			chunk.files[ isWebpack4 ? 'push' : 'add' ]( assetFilename );
		}

		if ( combineAssets ) {
			const outputFolder = compilation.outputOptions.path;

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
	}
}

module.exports = DependencyExtractionWebpackPlugin;
