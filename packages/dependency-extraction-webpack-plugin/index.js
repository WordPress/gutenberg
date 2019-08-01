/**
 * External dependencies
 */
const { createHash } = require( 'crypto' );
const { ExternalsPlugin } = require( 'webpack' );
const { RawSource } = require( 'webpack-sources' );

/**
 * Internal dependencies
 */
const { defaultRequestToExternal, defaultRequestToHandle } = require( './util' );

class DependencyExtractionWebpackPlugin {
	constructor( options ) {
		this.options = Object.assign(
			{
				injectPolyfill: false,
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
		this.externalsPlugin = new ExternalsPlugin( 'this', this.externalizeWpDeps.bind( this ) );
	}

	externalizeWpDeps( context, request, callback ) {
		let externalRequest;

		// Handle via options.requestToExternal first
		if ( typeof this.options.requestToExternal === 'function' ) {
			externalRequest = this.options.requestToExternal( request );
		}

		// Cascade to default if unhandled and enabled
		if ( typeof externalRequest === 'undefined' && this.options.useDefaults ) {
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

	apply( compiler ) {
		this.externalsPlugin.apply( compiler );

		const { output } = compiler.options;
		const { filename: outputFilename } = output;

		compiler.hooks.emit.tap( this.constructor.name, ( compilation ) => {
			// Process each entrypoint independently.
			for ( const [ entrypointName, entrypoint ] of compilation.entrypoints.entries() ) {
				const entrypointExternalizedWpDeps = new Set();
				if ( this.options.injectPolyfill ) {
					entrypointExternalizedWpDeps.add( 'wp-polyfill' );
				}

				// Search for externalized modules in all chunks.
				for ( const chunk of entrypoint.chunks ) {
					for ( const { userRequest } of chunk.modulesIterable ) {
						if ( this.externalizedDeps.has( userRequest ) ) {
							const scriptDependency = this.mapRequestToDependency( userRequest );
							entrypointExternalizedWpDeps.add( scriptDependency );
						}
					}
				}

				// Build a stable JSON string that declares the WordPress script dependencies.
				const sortedDepsArray = Array.from( entrypointExternalizedWpDeps ).sort();
				const depsString = JSON.stringify( sortedDepsArray );

				// Determine a filename for the `[entrypoint].deps.json` file.
				const [ filename, query ] = entrypointName.split( '?', 2 );
				const depsFilename = compilation
					.getPath( outputFilename, {
						chunk: entrypoint.getRuntimeChunk(),
						filename,
						query,
						basename: basename( filename ),
						contentHash: createHash( 'md4' )
							.update( depsString )
							.digest( 'hex' ),
					} )
					.replace( /\.js$/i, '.deps.json' );

				// Add source and file into compilation for webpack to output.
				compilation.assets[ depsFilename ] = new RawSource( depsString );
				entrypoint.getRuntimeChunk().files.push( depsFilename );
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
