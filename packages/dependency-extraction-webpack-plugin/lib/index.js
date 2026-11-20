const path = require( 'path' );
const webpack = require( 'webpack' );
const json2php = require( 'json2php' );
const { createHash } = webpack.util;
const {
	defaultRequestToExternal,
	defaultRequestToExternalModule,
	defaultRequestToHandle,
} = require( './util' );

const { RawSource } = webpack.sources;
const { AsyncDependenciesBlock } = webpack;

const defaultExternalizedReportFileName = 'externalized-dependencies.json';

/**
 * Lazily instantiated shared PHP printer.
 *
 * @type {undefined | ( ( data: unknown ) => string )}
 */
let phpPrinter;

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
	 * Map a request to the external that the plugin externalizes it to.
	 *
	 * @param {string} request Requested module.
	 * @return {string|string[]|undefined} The external, or `undefined` when the
	 *   plugin does not externalize the request.
	 * @throws {Error} When the request can't be used, like a WordPress script in a script module.
	 */
	mapRequestToExternal( request ) {
		let externalRequest;

		// Handle via options.requestToExternal(Module)  first.
		if ( this.useModules ) {
			if ( typeof this.options.requestToExternalModule === 'function' ) {
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

		return externalRequest;
	}

	/**
	 * @param {webpack.ExternalItemFunctionData}                             data
	 * @param { ( err?: null | Error, result?: string | string[] ) => void } callback
	 */
	externalizeWpDeps( { request }, callback ) {
		let externalRequest;

		try {
			externalRequest = this.mapRequestToExternal( request );
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
	 * Keep each `import()` of an externalized request in a module apart from
	 * the module's static imports of the same request.
	 *
	 * Webpack externalizes the dependencies of one module that share a
	 * resource identifier together, with the kind of the first one, so a
	 * static import and an `import()` of one request would get one kind.
	 * Giving the `import()` its own resource identifier makes webpack
	 * externalize it on its own, with the dynamic kind. The dependency keeps
	 * that identifier when a rebuild reuses the module from the memory cache.
	 *
	 * A `webpackMode: "weak"` `import()` stays with the static imports: on its
	 * own, it would point to an external that no chunk loads, so it would
	 * always reject. Grouped, it comes first, so the group, the file's static
	 * imports of the request included, gets the dynamic kind.
	 *
	 * @param {webpack.Module} module Module whose dependencies webpack is about to resolve.
	 */
	separateDynamicImports( module ) {
		const blocks = [ module ];
		while ( blocks.length ) {
			const block = blocks.pop();
			blocks.push( ...block.blocks );

			for ( const dependency of block.dependencies ) {
				// Webpack types the dependency of an `import()` of a string as
				// `import()`, or as `import() eager` in eager mode, where the
				// module holds it instead of an async block.
				if (
					! [ 'import()', 'import() eager' ].includes(
						dependency.type
					) ||
					! this.isExternalized( dependency.request )
				) {
					continue;
				}

				const resourceIdentifier = dependency.getResourceIdentifier();
				dependency.getResourceIdentifier = () =>
					`${ resourceIdentifier }|import()`;
			}
		}
	}

	/**
	 * @param {string} request Requested module.
	 * @return {boolean} Whether the plugin externalizes the request.
	 */
	isExternalized( request ) {
		try {
			return Boolean( this.mapRequestToExternal( request ) );
		} catch {
			// Webpack reports the error when it resolves the request.
			return false;
		}
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
			if ( ! phpPrinter ) {
				phpPrinter = json2php.make( {
					linebreak: '\n',
					indent: '\t',
				} );
			}
			return `<?php return ${ phpPrinter(
				JSON.parse( JSON.stringify( asset ) )
			) };\n`;
		}

		return JSON.stringify( asset, null, '\t' );
	}

	/** @type {webpack.WebpackPluginInstance['apply']} */
	apply( compiler ) {
		this.useModules = Boolean( compiler.options.output?.module );

		/**
		 * Offload externalization work to the ExternalsPlugin.
		 *
		 * Script modules use the `module-import` type, so a static `import`
		 * declaration of an external stays static and an `import()` of it stays
		 * dynamic (see `separateDynamicImports` for a file that has both).
		 *
		 * @type {webpack.ExternalsPlugin}
		 */
		this.externalsPlugin = new webpack.ExternalsPlugin(
			this.useModules ? 'module-import' : 'window',
			this.externalizeWpDeps.bind( this )
		);

		this.externalsPlugin.apply( compiler );

		compiler.hooks.thisCompilation.tap(
			this.constructor.name,
			( compilation ) => {
				if ( this.useModules ) {
					// Runs after webpack parses a module and before it resolves
					// the module's dependencies.
					compilation.hooks.succeedModule.tap(
						this.constructor.name,
						( module ) => this.separateDynamicImports( module )
					);
				}

				compilation.hooks.processAssets.tap(
					{
						name: this.constructor.name,
						stage: compiler.webpack.Compilation
							.PROCESS_ASSETS_STAGE_OPTIMIZE_COMPATIBILITY,
					},
					() => this.checkForMagicComments( compilation )
				);
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

	/**
	 * Check for magic comments before minification, so minification doesn't have to preserve them.
	 * @param {webpack.Compilation} compilation
	 */
	checkForMagicComments( compilation ) {
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

			// Prepare to look for magic comments, in order to decide whether
			// `wp-polyfill` is needed.
			const processContentsForMagicComments = ( content ) => {
				const magicComments = [];

				if ( content.includes( '/* wp:polyfill */' ) ) {
					magicComments.push( 'wp-polyfill' );
				}

				return magicComments;
			};

			// Go through the assets to process the sources.
			// This allows us to look for magic comments.
			chunkFiles.sort().forEach( ( filename ) => {
				const asset = compilation.getAsset( filename );
				const content = asset.source.buffer();

				const wpMagicComments =
					processContentsForMagicComments( content );
				compilation.updateAsset( filename, ( v ) => v, {
					wpMagicComments,
				} );
			} );
		}
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

		const jsExtensionRegExp = this.useModules ? /\.m?js$/i : /\.js$/i;

		// Accumulate all entrypoint chunks, some of them shared
		const entrypointChunks = new Set();

		/**
		 * Track the files of each entrypoint's JS-less chunks, typically styles
		 * extracted by a `style.css` cache group. Those chunks don't get an
		 * asset file of their own, but their content must contribute to the
		 * version hash of the entrypoint's entry chunk so that style-only
		 * changes still produce a new version.
		 *
		 * @type {Map<webpack.Chunk, Set<string>>}
		 */
		const styleFilesByEntryChunk = new Map();
		for ( const entrypoint of compilation.entrypoints.values() ) {
			const entryChunk = entrypoint.getEntrypointChunk();
			for ( const chunk of entrypoint.chunks ) {
				entrypointChunks.add( chunk );

				if (
					chunk === entryChunk ||
					Array.from( chunk.files ).some( ( f ) =>
						jsExtensionRegExp.test( f )
					)
				) {
					continue;
				}

				const styleFiles =
					styleFilesByEntryChunk.get( entryChunk ) ?? new Set();
				for ( const file of chunk.files ) {
					styleFiles.add( file );
				}
				styleFilesByEntryChunk.set( entryChunk, styleFiles );
			}
		}

		// Process each entrypoint chunk independently
		for ( const chunk of entrypointChunks ) {
			const chunkFiles = Array.from( chunk.files );

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
			 * @param {boolean}        [fromAsyncChunk] Module was found in an
			 *                                          async chunk of the entry.
			 */
			const processModule = ( m, fromAsyncChunk ) => {
				const { userRequest } = m;
				if ( this.externalizedDeps.has( userRequest ) ) {
					if ( this.useModules ) {
						// Externals in an async chunk are reached via a dynamic
						// import by definition.
						const isStatic =
							! fromAsyncChunk &&
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

			/**
			 * @param {webpack.Chunk} searchChunk
			 * @param {boolean}       [fromAsyncChunk]
			 */
			const processChunkModules = ( searchChunk, fromAsyncChunk ) => {
				for ( const chunkModule of compilation.chunkGraph.getChunkModulesIterable(
					searchChunk
				) ) {
					processModule( chunkModule, fromAsyncChunk );
					// Loop through submodules of ConcatenatedModule.
					if ( chunkModule.modules ) {
						for ( const concatModule of chunkModule.modules ) {
							processModule( concatModule, fromAsyncChunk );
						}
					}
				}
			};

			processChunkModules( chunk );

			/*
			 * Also search the entry's async chunks: webpack can code-split a
			 * dynamically imported external into its own chunk.
			 */
			for ( const group of chunk.groupsIterable ) {
				if (
					typeof group.getEntrypointChunk !== 'function' ||
					group.getEntrypointChunk() !== chunk
				) {
					continue;
				}
				const seenGroups = new Set();
				const groupQueue = [ ...group.getChildren() ];
				while ( groupQueue.length ) {
					const childGroup = groupQueue.pop();
					if ( seenGroups.has( childGroup ) ) {
						continue;
					}
					seenGroups.add( childGroup );
					for ( const asyncChunk of childGroup.chunks ) {
						processChunkModules( asyncChunk, true );
					}
					groupQueue.push( ...childGroup.getChildren() );
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
			const handleMagicComments = ( info ) => {
				if ( ! info ) {
					return;
				}
				if ( info.includes( 'wp-polyfill' ) ) {
					chunkStaticDeps.add( 'wp-polyfill' );
				}
			};

			// Include the files of the entrypoint's JS-less sibling chunks,
			// typically extracted styles, in the version hash so that
			// style-only changes still produce a new version.
			const filesToHash = [
				...new Set( [
					...chunkFiles,
					...( styleFilesByEntryChunk.get( chunk ) ?? [] ),
				] ),
			];

			// Go through the assets to process the sources.
			// This allows us to generate hashes, as well as look for magic comments.
			filesToHash.sort().forEach( ( filename ) => {
				const asset = compilation.getAsset( filename );
				const content = asset.source.buffer();

				processContentsForHash( content );
				handleMagicComments( asset.info.wpMagicComments );
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
						// A static occurrence of a script module wins.
						.filter( ( id ) => ! chunkStaticDeps.has( id ) )
						.sort()
						.map( ( id ) => ( { id, import: 'dynamic' } ) ),
				],
				version: contentHash,
			};

			if ( this.useModules ) {
				assetData.type = 'module';
			}

			if ( compilation.options?.optimization?.runtimeChunk !== false ) {
				// Sets the script handle for the shared runtime file so WordPress registers it only once when using the asset file.
				assetData.handle =
					compilation.name +
					'-' +
					chunkJSFile
						.replace( /\\/g, '/' )
						.replace( jsExtensionRegExp, '' );
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

	static #staticDepsCurrent = new WeakSet();
	static #staticDepsCache = new WeakMap();

	/**
	 * Can we trace a line of static dependencies from an entry to a module
	 *
	 * @param {webpack.Compilation}       compilation
	 * @param {webpack.DependenciesBlock} block
	 *
	 * @return {boolean} True if there is a static import path to the root
	 */
	static hasStaticDependencyPathToRoot( compilation, block ) {
		if ( DependencyExtractionWebpackPlugin.#staticDepsCache.has( block ) ) {
			return DependencyExtractionWebpackPlugin.#staticDepsCache.get(
				block
			);
		}

		if (
			DependencyExtractionWebpackPlugin.#staticDepsCurrent.has( block )
		) {
			return false;
		}

		DependencyExtractionWebpackPlugin.#staticDepsCurrent.add( block );

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
			DependencyExtractionWebpackPlugin.#staticDepsCache.set(
				block,
				true
			);
			DependencyExtractionWebpackPlugin.#staticDepsCurrent.delete(
				block
			);
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
			DependencyExtractionWebpackPlugin.#staticDepsCache.set(
				block,
				false
			);
			DependencyExtractionWebpackPlugin.#staticDepsCurrent.delete(
				block
			);
			return false;
		}

		// Continue to explore any static dependencies
		const result = staticDependentModules.some(
			( parentStaticDependentModule ) =>
				DependencyExtractionWebpackPlugin.hasStaticDependencyPathToRoot(
					compilation,
					parentStaticDependentModule
				)
		);

		DependencyExtractionWebpackPlugin.#staticDepsCache.set( block, result );
		DependencyExtractionWebpackPlugin.#staticDepsCurrent.delete( block );
		return result;
	}
}

module.exports = DependencyExtractionWebpackPlugin;
