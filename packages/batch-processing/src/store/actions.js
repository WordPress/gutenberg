/**
 * External dependencies
 */
import { v4 as uuid } from 'uuid';

/**
 * Internal dependencies
 */
import { select } from './controls';

export const enqueueForBatchProcessing = function (
	queue,
	context,
	item,
	autoCommit = true
) {
	return {
		type: 'ENQUEUE_ITEM',
		queue,
		context,
		item,
		autoCommit,
	};
};

export const commit = async function* ( queue, context ) {
	const transactionId = uuid();
	yield prepareBatchTransaction( queue, context, transactionId );
	const transaction = yield select( 'getTransaction', transactionId );

	yield {
		type: 'COMMIT_START',
		queue,
		context,
		transactionId,
	};

	const processor = yield select( 'getProcessor', queue );
	for ( const chunk of transaction.chunks ) {
		yield {
			type: 'COMMIT_CHUNK_START',
			transactionId,
			chunkId: chunk.id,
		};
		try {
			const result = await processor( chunk );
			yield {
				transactionId,
				type: 'COMMIT_CHUNK_SUCCESS',
				chunkId: chunk.id,
				result,
			};
		} catch ( e ) {
			yield {
				type: 'COMMIT_CHUNK_ERROR',
				transactionId,
				chunkId: chunk.id,
				error: e,
			};
			yield {
				type: 'COMMIT_ERROR',
				transactionId,
				chunkId: chunk.id,
				error: e,
			};
			return;
		}
	}

	yield {
		type: 'COMMIT_SUCCESS',
		transactionId,
	};
};

export function prepareBatchTransaction( queue, context, transactionId ) {
	return {
		type: 'PREPARE_BATCH_TRANSACTION',
		queue,
		context,
		transactionId,
	};
}

export const registerProcessor = function ( queue, processor ) {
	return {
		type: 'REGISTER_PROCESSOR',
		queue,
		processor,
	};
};
