/**
 * WordPress dependencies
 */
import apiFetch from '@wordpress/api-fetch';
import { STATE_ERROR } from '@wordpress/batch-processing';
import { dispatch } from '@wordpress/data';

function shoehornBatchSupport() {
	apiFetch.use( ( options, next ) => {
		if (
			! [ 'POST', 'PUT', 'PATCH', 'DELETE' ].includes( options.method ) ||
			! isWidgetsEndpoint( options.path )
		) {
			return next( options );
		}
		return addToBatch( options );
	} );

	dispatch( 'core/batch-processing' ).registerProcessor(
		'WIDGETS_API_FETCH',
		batchProcessor
	);
}

function isWidgetsEndpoint( path ) {
	// This should be more sophisticated in reality:
	return (
		path.indexOf( '/widgets' ) !== -1 || path.indexOf( '/sidebars' ) !== -1
	);
}

// setTimeout is a hack to ensure batch-processing store is available for dispatching
setTimeout( shoehornBatchSupport );

const addToBatch = ( request ) => {
	return dispatch( 'core/batch-processing' ).enqueueItemAndAutocommit(
		'WIDGETS_API_FETCH',
		'default',
		request
	);
};

async function batchProcessor( requests, transaction ) {
	if ( transaction.state === STATE_ERROR ) {
		throw {
			code: 'transaction_failed',
			data: { status: 500 },
			message: 'Transaction failed.',
		};
	}

	const response = await apiFetch( {
		path: '/__experimental/batch',
		method: 'POST',
		data: {
			validation: 'require-all-validate',
			requests: requests.map( ( options ) => ( {
				path: options.path,
				body: options.data,
				method: options.method,
				headers: options.headers,
			} ) ),
		},
	} );

	if ( response.failed ) {
		throw response.responses.map( ( { body } ) => body );
	}

	return response.responses.map( ( { body } ) => body );
}
