/**
 * Internal dependencies
 */
const DependencyExtractionWebpackPlugin = require( '../../..' );

module.exports = {
	plugins: [
		new DependencyExtractionWebpackPlugin( {
			requestToExternal( request ) {
				switch ( request ) {
					case '@my/module':
					case 'other-module':
						return [ 'my-namespace', `renamed--${ request }` ];
				}
			},
			requestToHandle( request ) {
				switch ( request ) {
					case '@my/module':
					case 'other-module':
						return `renamed--${ request }`;
				}
			},
			requestToExternalModule( request ) {
				switch ( request ) {
					case '@my/module':
					case 'other-module':
						return `renamed--${ request }`;
				}
			},
		} ),
	],
};
