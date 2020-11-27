/**
 * External dependencies
 */
import { memoize } from 'lodash/function';

/**
 * WordPress dependencies
 */
import apiFetch from '@wordpress/api-fetch';
import { __ } from '@wordpress/i18n';
import { dispatch } from '@wordpress/data';

/**
 * Internal dependencies
 */
import './batch-processing';
import { STATE_ERROR } from './batch-processing/constants';

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

	const failed =
		response.failed ||
		response.responses.filter(
			( { status } ) => status < 200 || status >= 300
		).length;
	if ( failed ) {
		throw response.responses.map( ( itemResponse ) => {
			// The REST API returns null if the request did not have an error.
			return itemResponse === null
				? {
						code: 'transaction_failed',
						data: { status: 400 },
						message: __(
							'This item could not be saved because another item encountered an error when trying to save.'
						),
				  }
				: itemResponse.body;
		} );
	}

	return response.responses.map( ( { body } ) => body );
}

const determineBatchSize = memoize( async () => {
	const response = await apiFetch( {
		path: '/v1/batch',
		method: 'OPTIONS',
	} );
	return response.endpoints[ 0 ].args.requests.maxItems;
} );

// Ensure batch-processing store is available for dispatching
setTimeout( () => {
	dispatch( 'core/__experimental-batch-processing' ).registerProcessor(
		'API_FETCH',
		batchProcessor,
		determineBatchSize
	);
} );
