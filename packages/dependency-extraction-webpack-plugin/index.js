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
	constructor() {
		this.externalizedDeps = new Set();
		this.externalsPlugin = new ExternalsPlugin( 'global', [ this.externalizeWpDeps.bind( this ) ] );
	}

	externalizeWpDeps( context, request, callback ) {
		const externRootRequest = defaultRequestToExternal( request );

		if ( externRootRequest ) {
			this.externalizedDeps.add( request );
			return callback( null, `root ${ externRootRequest }` );
		}

		return callback();
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
							const scriptDependency = defaultRequestToScript( userRequest ) || userRequest;
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

		default:
			if ( request.startsWith( WORDPRESS_NAMESPACE ) ) {
				// @wordpress/api-fetch -> wp.apiFetch
				// @wordpress/i18n -> wp.i18n
				return `wp.${ camelCaseDash( request.substring( WORDPRESS_NAMESPACE.length ) ) }`;
			}
	}
}

function defaultRequestToScript( request ) {
	// Transform @wordpress dependencies:
	//   @wordpress/i18n -> wp-i18n
	//   @wordpress/escape-html -> wp-escape-html
	// Pass other externalized deps as they are
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
