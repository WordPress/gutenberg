/**
 * External dependencies
 */
import { v4 as uuid } from 'uuid';

/**
 * Internal dependencies
 */
import {
	select,
	enqueueItemAndAutocommit as enqueueAutocommitControl,
	processChunk,
} from './controls';

export const enqueueItemAndAutocommit = function* ( queue, context, item ) {
	yield enqueueAutocommitControl( queue, context, item, true );
};

export const enqueueItem = function ( queue, context, item ) {
	const itemId = uuid();
	return {
		type: 'ENQUEUE_ITEM',
		queue,
		context,
		item,
		itemId,
	};
};

export const commit = function* ( queue, context ) {
	const transactionId = uuid();
	yield prepareBatchTransaction( queue, context, transactionId );
	const transaction = yield select( 'getTransaction', transactionId );

	yield {
		type: 'COMMIT_START',
		queue,
		context,
		transactionId,
	};

	for ( const chunkId of Object.keys( transaction.chunks ) ) {
		yield {
			type: 'COMMIT_CHUNK_START',
			transactionId,
			chunkId,
		};
		try {
			const results = yield processChunk( transaction, chunkId );
			yield {
				transactionId,
				type: 'COMMIT_CHUNK_SUCCESS',
				chunkId,
				results,
			};
		} catch ( e ) {
			yield {
				type: 'COMMIT_CHUNK_ERROR',
				transactionId,
				chunkId,
				error: e,
			};
			yield {
				type: 'COMMIT_ERROR',
				transactionId,
				chunkId,
				error: e,
			};
			return;
		}
	}

	yield {
		type: 'COMMIT_SUCCESS',
		transactionId,
	};

	const finishedTransaction = yield select( 'getTransaction', transactionId );
	return finishedTransaction.results;
};

export function prepareBatchTransaction( queue, context, transactionId ) {
	return {
		type: 'PREPARE_BATCH_TRANSACTION',
		queue,
		context,
		transactionId,
	};
}

export const registerProcessor = function ( queue, callback ) {
	return {
		type: 'REGISTER_PROCESSOR',
		queue,
		callback,
	};
};
