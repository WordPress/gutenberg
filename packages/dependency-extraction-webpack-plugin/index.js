/**
 * External dependencies
 */
const { createHash } = require( 'crypto' );
const { ExternalsPlugin } = require( 'webpack' );
const { RawSource } = require( 'webpack-sources' );

const WORDPRESS_NAMESPACE = '@wordpress/';

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
		this.externalsPlugin = new ExternalsPlugin( 'global', [ this.externalizeWpDeps.bind( this ) ] );
	}

	externalizeWpDeps( context, request, callback ) {
		let externRootRequest;

		// Handle via options.requestToExternal first
		if ( typeof this.options.requestToExternal === 'function' ) {
			externRootRequest = this.options.requestToExternal( request );
		}

		// Cascade to default if unhandled and enabled
		if ( typeof externRootRequest === 'undefined' && this.options.useDefaults ) {
			externRootRequest = defaultRequestToExternal( request );
		}

		if ( externRootRequest ) {
			this.externalizedDeps.add( request );
			return callback( null, `root ${ externRootRequest }` );
		}

		return callback();
	}

	mapRequestToDependency( request ) {
		// Handle via options.requestToDependency first
		if ( typeof this.options.requestToDependency === 'function' ) {
			const scriptDependency = this.options.requestToDependency( request );
			if ( scriptDependency ) {
				return scriptDependency;
			}
		}

		// Cascade to default if enabled
		if ( this.options.useDefaults ) {
			const scriptDependency = defaultRequestToDependency( request );
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
				const depsFilename = compilation.getPath(
					outputFilename.replace( /\.js$/i, '.deps.json' ),
					{
						chunk: entrypoint.getRuntimeChunk(),
						filename,
						query,
						basename: basename( filename ),
						contentHash: createHash( 'md4' )
							.update( depsString )
							.digest( 'hex' ),
					}
				);

				// Add source and file into compilation for webpack to output.
				compilation.assets[ depsFilename ] = new RawSource( depsString );
				entrypoint.getRuntimeChunk().files.push( depsFilename );
			}
		} );
	}
}

/**
 * Handle default dependency to WordPress global transformation
 *
 * Transform @wordpress dependencies:
 *   @wordpress/api-fetch -> wp.apiFetch
 *   @wordpress/i18n -> wp.i18n
 *
 * @param {string} request Requested module
 *
 * @return {(string|undefined)} Script global
 */
function defaultRequestToExternal( request ) {
	switch ( request ) {
		case '@babel/runtime/regenerator':
			return 'regeneratorRuntime';

		case 'lodash':
		case 'lodash-es':
		case 'moment':
			return request;

		case 'jquery':
			return 'jQuery';

		case 'react':
			return 'React';

		case 'react-dom':
			return 'ReactDOM';
	}

	if ( request.startsWith( WORDPRESS_NAMESPACE ) ) {
		return `wp.${ camelCaseDash( request.substring( WORDPRESS_NAMESPACE.length ) ) }`;
	}
}

/**
 * Handle default dependency to WordPress script dependency slug transformation
 *
 * Transform @wordpress dependencies:
 *   @wordpress/i18n -> wp-i18n
 *   @wordpress/escape-html -> wp-escape-html
 *
 * @param {string} request Requested module
 *
 * @return {(string|undefined)} Script dependency slug
 */
function defaultRequestToDependency( request ) {
	if ( request === '@babel/runtime/regenerator' ) {
		return 'wp-polyfill';
	}

	if ( request.startsWith( WORDPRESS_NAMESPACE ) ) {
		return 'wp-' + request.substring( WORDPRESS_NAMESPACE.length );
	}
}

function basename( name ) {
	if ( ! name.includes( '/' ) ) {
		return name;
	}
	return name.substr( name.lastIndexOf( '/' ) + 1 );
}

/**
 * Given a string, returns a new string with dash separators converted to
 * camelCase equivalent. This is not as aggressive as `_.camelCase` in
 * converting to uppercase, where Lodash will also capitalize letters
 * following numbers.
 *
 * Temporarily duplicated from @wordpress/scripts/utils.
 *
 * @param {string} string Input dash-delimited string.
 *
 * @return {string} Camel-cased string.
 */
function camelCaseDash( string ) {
	return string.replace( /-([a-z])/g, ( match, letter ) => letter.toUpperCase() );
}

module.exports = DependencyExtractionWebpackPlugin;
