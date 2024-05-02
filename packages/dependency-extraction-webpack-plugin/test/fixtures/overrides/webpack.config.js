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
				return request.startsWith( '@wordpress/' );
			},
			requestToHandle( request ) {
				if ( request === 'rxjs' || request === 'rxjs/operators' ) {
					return 'wp-script-handle-for-rxjs';
				}
			},
		} ),
	],
};
