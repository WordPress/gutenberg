/**
 * External dependencies
 */
const path = require( 'path' );
const webpack = require( 'webpack' );
const json2php = require( 'json2php' );
const { createHash } = webpack.util;

/**
 * Internal dependencies
 */
const {
	defaultRequestToExternal,
	defaultRequestToExternalModule,
	defaultRequestToHandle,
} = require( './util' );

const { RawSource } = webpack.sources;
const { AsyncDependenciesBlock } = webpack;

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

		/**
		 * Should we use modules. This will be set later to match webpack's
		 * output.module option.
		 *
		 * @type {boolean}
		 */
		this.useModules = false;

		/**
		 * Offload externalization work to the ExternalsPlugin.
		 */
		this.externalsPlugin = new webpack.ExternalsPlugin(
			'window',
			this.externalizeWpDeps.bind( this )
		);
	}

	/**
	 * @param {webpack.ExternalItemFunctionData}                             data
	 * @param { ( err?: null | Error, result?: string | string[] ) => void } callback
	 */
	externalizeWpDeps( { request }, callback ) {
		let externalRequest;

		// Handle via options.requestToExternal(Module)  first.
		if ( this.useModules ) {
			if ( typeof this.options.requestToExternalModule === 'function' ) {
				externalRequest =
					this.options.requestToExternalModule( request );
			}
		} else if ( typeof this.options.requestToExternal === 'function' ) {
			externalRequest = this.options.requestToExternal( request );
		}

		// Cascade to default if unhandled and enabled.
		if (
			typeof externalRequest === 'undefined' &&
			this.options.useDefaults
		) {
			externalRequest = this.useModules
				? defaultRequestToExternalModule( request )
				: defaultRequestToExternal( request );
		}

		if ( externalRequest ) {
			this.externalizedDeps.add( request );

			return callback( null, externalRequest );
		}

		return callback();
	}

	/**
	 * @param {string} request
	 * @return {string} Mapped dependency name
	 */
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

	/**
	 * @param {any} asset Asset Data
	 * @return {string} Stringified asset data suitable for output
	 */
	stringify( asset ) {
		if ( this.options.outputFormat === 'php' ) {
			return `<?php return ${ json2php(
				JSON.parse( JSON.stringify( asset ) )
			) };\n`;
		}

		return JSON.stringify( asset );
	}

	/** @type {webpack.WebpackPluginInstance['apply']} */
	apply( compiler ) {
		this.useModules = Boolean( compiler.options.output?.module );

		if ( this.useModules ) {
			this.externalsPlugin.type = 'module';
		}

		this.externalsPlugin.apply( compiler );

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

	/** @param {webpack.Compilation} compilation */
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

			const jsExtensionRegExp = this.useModules ? /\.m?js$/i : /\.js$/i;

			const chunkJSFile = chunkFiles.find( ( f ) =>
				jsExtensionRegExp.test( f )
			);
			if ( ! chunkJSFile ) {
				// There's no JS file in this chunk, no work for us. Typically a `style.css` from cache group.
				continue;
			}

			/** @type {Set<string>} */
			const chunkStaticDeps = new Set();
			/** @type {Set<string>} */
			const chunkDynamicDeps = new Set();

			if ( injectPolyfill ) {
				chunkStaticDeps.add( 'wp-polyfill' );
			}

			const processModule = ( m ) => {
				const { userRequest } = m;
				if ( this.externalizedDeps.has( userRequest ) ) {
					if ( this.useModules ) {
						let isDynamic = true;
						for ( const incomingConnection of compilation.moduleGraph.getIncomingConnections(
							m
						) ) {
							const { dependency } = incomingConnection;
							if (
								! (
									compilation.moduleGraph.getParentBlock(
										dependency
									).constructor.name ===
									AsyncDependenciesBlock.name
								)
							) {
								isDynamic = false;
								break;
							}
						}

						( isDynamic ? chunkDynamicDeps : chunkStaticDeps ).add(
							userRequest
						);
					} else {
						chunkStaticDeps.add(
							this.mapRequestToDependency( userRequest )
						);
					}
				}
			};

			// Search for externalized modules in all chunks.
			for ( const chunkModule of compilation.chunkGraph.getChunkModulesIterable(
				chunk
			) ) {
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
				dependencies: [
					// Sort these so we can produce a stable, stringified representation.
					...Array.from( chunkStaticDeps ).sort(),
					...Array.from( chunkDynamicDeps )
						.sort()
						.map( ( id ) => ( { id, type: 'dynamic' } ) ),
				],
				version: contentHash,
			};

			if ( this.useModules ) {
				assetData.type = 'module';
			}

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
					.replace( /\.m?js$/i, suffix );
			}

			// Add source and file into compilation for webpack to output.
			compilation.assets[ assetFilename ] = new RawSource(
				this.stringify( assetData )
			);
			chunk.files.add( assetFilename );
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
