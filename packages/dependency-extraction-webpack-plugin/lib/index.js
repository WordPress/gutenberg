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
	}

	/**
	 * @param {webpack.ExternalItemFunctionData}                             data
	 * @param { ( err?: null | Error, result?: string | string[] ) => void } callback
	 */
	externalizeWpDeps( { request }, callback ) {
		let externalRequest;

		try {
			// Handle via options.requestToExternal(Module)  first.
			if ( this.useModules ) {
				if (
					typeof this.options.requestToExternalModule === 'function'
				) {
					externalRequest =
						this.options.requestToExternalModule( request );

					// requestToExternalModule allows a boolean shorthand
					if ( externalRequest === false ) {
						externalRequest = undefined;
					}
					if ( externalRequest === true ) {
						externalRequest = request;
					}
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
		} catch ( err ) {
			return callback( err );
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

		/**
		 * Offload externalization work to the ExternalsPlugin.
		 * @type {webpack.ExternalsPlugin}
		 */
		this.externalsPlugin = new webpack.ExternalsPlugin(
			this.useModules ? 'import' : 'window',
			this.externalizeWpDeps.bind( this )
		);

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

			/**
			 * @param {webpack.Module} m
			 */
			const processModule = ( m ) => {
				const { userRequest } = m;
				if ( this.externalizedDeps.has( userRequest ) ) {
					if ( this.useModules ) {
						const isStatic =
							DependencyExtractionWebpackPlugin.hasStaticDependencyPathToRoot(
								compilation,
								m
							);

						( isStatic ? chunkStaticDeps : chunkDynamicDeps ).add(
							m.request
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

			// Prepare to hash the sources. We can't just use
			// `chunk.contentHash` because that's not updated when
			// assets are minified. In practice the hash is updated by
			// `RealContentHashPlugin` after minification, but it only modifies
			// already-produced asset filenames and the updated hash is not
			// available to plugins.
			const { hashFunction, hashDigest, hashDigestLength } =
				compilation.outputOptions;

			const hashBuilder = createHash( hashFunction );

			const processContentsForHash = ( content ) => {
				hashBuilder.update( content );
			};

			// Prepare to look for magic comments, in order to decide whether
			// `wp-polyfill` is needed.
			const processContentsForMagicComments = ( content ) => {
				if ( content.includes( '/* wp:polyfill */' ) ) {
					chunkStaticDeps.add( 'wp-polyfill' );
				}
			};

			// Go through the assets to process the sources.
			// This allows us to generate hashes, as well as look for magic comments.
			chunkFiles.sort().forEach( ( filename ) => {
				const asset = compilation.getAsset( filename );
				const content = asset.source.buffer();

				processContentsForHash( content );
				processContentsForMagicComments( content );
			} );

			// Finalise hash.
			const contentHash = hashBuilder
				.digest( hashDigest )
				.slice( 0, hashDigestLength );

			const assetData = {
				dependencies: [
					// Sort these so we can produce a stable, stringified representation.
					...Array.from( chunkStaticDeps ).sort(),
					...Array.from( chunkDynamicDeps )
						.sort()
						.map( ( id ) => ( { id, import: 'dynamic' } ) ),
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

	/**
	 * Can we trace a line of static dependencies from an entry to a module
	 *
	 * @param {webpack.Compilation}       compilation
	 * @param {webpack.DependenciesBlock} block
	 *
	 * @return {boolean} True if there is a static import path to the root
	 */
	static hasStaticDependencyPathToRoot( compilation, block ) {
		const incomingConnections = [
			...compilation.moduleGraph.getIncomingConnections( block ),
		].filter(
			( connection ) =>
				// Library connections don't have a dependency, this is a root
				connection.dependency &&
				// Entry dependencies are another root
				connection.dependency.constructor.name !== 'EntryDependency'
		);

		// If we don't have non-entry, non-library incoming connections,
		// we've reached a root of
		if ( ! incomingConnections.length ) {
			return true;
		}

		const staticDependentModules = incomingConnections.flatMap(
			( connection ) => {
				const { dependency } = connection;
				const parentBlock =
					compilation.moduleGraph.getParentBlock( dependency );

				return parentBlock.constructor.name !==
					AsyncDependenciesBlock.name
					? [ compilation.moduleGraph.getParentModule( dependency ) ]
					: [];
			}
		);

		// All the dependencies were Async, the module was reached via a dynamic import
		if ( ! staticDependentModules.length ) {
			return false;
		}

		// Continue to explore any static dependencies
		return staticDependentModules.some( ( parentStaticDependentModule ) =>
			DependencyExtractionWebpackPlugin.hasStaticDependencyPathToRoot(
				compilation,
				parentStaticDependentModule
			)
		);
	}
}

module.exports = DependencyExtractionWebpackPlugin;
