/**
 * Internal dependencies
 */
const DependencyExtractionWebpackPlugin = require( '../../..' );

module.exports = {
	plugins: [
		new DependencyExtractionWebpackPlugin( {
			requestToExternal( request ) {
				if ( request === 'rxjs' ) {
					return 'rxjs';
				}

				if ( request === 'rxjs/operators' ) {
					return [ 'rxjs', 'operators' ];
				}
			},
			requestToExternalModule( request ) {
				if ( request === 'rxjs' ) {
					return request;
				}

				if ( request === 'rxjs/operators' ) {
					return request;
				}
				if ( request.startsWith( '@wordpress/' ) ) {
					return request;
				}
			},
			requestToHandle( request ) {
				if ( request === 'rxjs' || request === 'rxjs/operators' ) {
					return 'wp-script-handle-for-rxjs';
				}
			},
		} ),
	],
};
