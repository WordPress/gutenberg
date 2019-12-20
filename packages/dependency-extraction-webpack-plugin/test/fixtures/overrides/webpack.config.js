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
			requestToHandle( request ) {
				if ( request === 'rxjs' || request === 'rxjs/operators' ) {
					return 'wp-script-handle-for-rxjs';
				}
			},
		} ),
	],
};
