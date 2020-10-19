/**
 * WordPress dependencies
 */
import apiFetch from '@wordpress/api-fetch';
import { select, dispatch } from '@wordpress/data';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import './batch-processing';
import { STATE_ERROR } from './batch-processing/constants';

function shoehornBatchSupport() {
	apiFetch.use( async ( options, next ) => {
		if (
			! [ 'POST', 'PUT', 'PATCH', 'DELETE' ].includes( options.method ) ||
			! isWidgetsEndpoint( options.path )
		) {
			return next( options );
		}

		const { wait } = await addToBatch( options );

		return wait.catch( ( error ) => {
			// If this item didn't encounter an error specifically, the REST API
			// will return `null`. We need to provide an error object of some kind
			// to the apiFetch caller as they expect either a valid response, or
			// an error. Null wouldn't be acceptable.
			if ( error === null ) {
				error = {
					code: 'transaction_failed',
					data: { status: 400 },
					message: __(
						'This item could not be saved because another item encountered an error when trying to save.'
					),
				};
			}

			throw error;
		} );
	} );

	// This is a hack to prevent the following timing problem:
	// * batch request starts, cache is invalidated ->
	// * resolvers sends GET request to /wp/v2/widgets?per_page=-1 before the batch is finished ->
	// * batch request is processed and new widgets are saved ->
	// * core/data stores the new version of the data ->
	// * GET request is processed and returns the old widgets ->
	// * core/data overwrites good data with stale data
	//
	// The ultimate solution is to fix the problem in core/data but this has to do for now
	apiFetch.use( async ( options, next ) => {
		if (
			[ 'GET', undefined ].includes( options.method ) &&
			isWidgetsEndpoint( options.path )
		) {
			// Wait for any batch requests already in progress
			await Promise.all(
				select( 'core/__experimental-batch-processing' ).getPromises(
					'WIDGETS_API_FETCH'
				)
			);
		}
		return next( options );
	} );

	dispatch( 'core/__experimental-batch-processing' ).registerProcessor(
		'WIDGETS_API_FETCH',
		batchProcessor
	);
}

function isWidgetsEndpoint( path ) {
	// This should be more sophisticated in reality:
	return path.startsWith( '/wp/v2/widgets' );
}

function addToBatch( request ) {
	return dispatch(
		'core/__experimental-batch-processing'
	).enqueueItemAndWaitForResults( 'WIDGETS_API_FETCH', 'default', request );
}

async function batchProcessor( requests, transaction ) {
	if ( transaction.state === STATE_ERROR ) {
		throw {
			code: 'transaction_failed',
			data: { status: 500 },
			message: 'Transaction failed.',
		};
	}

	const response = await apiFetch( {
		path: '/v1/batch',
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
		throw response.responses.map( ( itemResponse ) => {
			// The REST API returns null if the request did not have an error.
			return itemResponse === null ? null : itemResponse.body;
		} );
	}

	return response.responses.map( ( { body } ) => body );
}

// setTimeout is a hack to ensure batch-processing store is available for dispatching
setTimeout( shoehornBatchSupport );
