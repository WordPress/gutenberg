/**
 * WordPress dependencies
 */
const { camelCaseDash } = require( '@wordpress/scripts/utils' );

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
		this.externalizedDeps = new Set();
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
			// Each entrypoint will get a .deps.json file
			for ( const [ entrypointName, entrypoint ] of compilation.entrypoints.entries() ) {
				const entrypointExternalizedWpDeps = new Set();

				// Search for externalized dependencies in all modules in all entrypoint chunks
				for ( const c of entrypoint.chunks ) {
					for ( const { userRequest } of c.modulesIterable ) {
						if ( this.externalizedDeps.has( userRequest ) ) {
							const scriptDependency = this.mapRequestToDependency( userRequest );
							entrypointExternalizedWpDeps.add( scriptDependency );
						}
					}
				}

				// Build a stable JSON string that declares the WordPress script dependencies.
				const sortedDepsArray = Array.from( entrypointExternalizedWpDeps ).sort();
				const depsString = JSON.stringify( sortedDepsArray );

				// Determine a name for the `[entrypoint].deps.json` file.
				const [ filename, query ] = entrypointName.split( '?', 2 );
				const depsFile = compilation.getPath( outputFilename.replace( /\.js$/i, '.deps.json' ), {
					chunk: entrypoint.getRuntimeChunk(),
					filename,
					query,
					basename: basename( filename ),
					contentHash: createHash( 'md4' )
						.update( depsString )
						.digest( 'hex' ),
				} );

				// Inject source/file into the compilation for webpack to output.
				compilation.assets[ depsFile ] = new RawSource( depsString );
				entrypoint.getRuntimeChunk().files.push( depsFile );
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
		case 'lodash':
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

module.exports = DependencyExtractionWebpackPlugin;
