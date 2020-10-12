/**
 * Internal dependencies
 */
import apiFetch from '../index';

const BATCH_TIME_WINDOW = 1000;
const MAX_BATCH_SIZE = 20;
const scheduledBatches = {};

/**
 * Middleware handling request batching.
 *
 * @param {Object}   options Fetch options.
 * @param {Function} next    [description]
 *
 * @return {*} The evaluated result of the remaining middleware chain.
 */
function batchRequestMiddleware( options, next ) {
	if (
		! [ 'POST', 'PUT', 'PATCH', 'DELETE' ].includes( options.method ) ||
		! options.batchAs ||
		! endpointSupportsBatch( options.path )
	) {
		return next( options );
	}

	const batchId = JSON.stringify( [ options.batchAs, options.method ] );
	const idx = addRequestToBatch( batchId, options );
	const save =
		scheduledBatches[ batchId ].length >= MAX_BATCH_SIZE
			? commit
			: commitEventually;
	return save( batchId ).then( ( subResponses ) => subResponses[ idx ] );
}

function endpointSupportsBatch( path ) {
	// This should be more sophisticated in reality:
	return path.indexOf( '/v2/template-parts' ) !== -1;
}

function addRequestToBatch( batchId, options ) {
	if ( ! scheduledBatches[ batchId ] ) {
		scheduledBatches[ batchId ] = {
			promise: null,
			requests: [],
		};
	}

	scheduledBatches[ batchId ].requests.push( options );
	return scheduledBatches[ batchId ].requests.length - 1;
}

function commitEventually( batchId ) {
	const batch = scheduledBatches[ batchId ];
	if ( ! batch.promise ) {
		batch.promise = new Promise( ( resolve ) => {
			setTimeout( () => resolve( commit( batchId ) ), BATCH_TIME_WINDOW );
		} );
	}
	return batch.promise;
}

function commit( batchId ) {
	// Pop unit of work so it cannot be altered by outside code
	const unitOfWork = scheduledBatches[ batchId ];
	delete scheduledBatches[ batchId ];

	// Clear eventual commit in case commit was called before commitEventually kicked in
	clearTimeout( unitOfWork.promise );

	// Maybe we could reuse raw options instead of mapping like that
	const requests = unitOfWork.requests.map( ( options ) => ( {
		path: options.path,
		body: options.body,
		headers: options.headers,
	} ) );

	return apiFetch( {
		path: '/wp/__experimental/batch',
		method: 'POST',
		data: {
			validation: 'require-all-validate',
			requests,
		},
	} );
}

export default batchRequestMiddleware;
