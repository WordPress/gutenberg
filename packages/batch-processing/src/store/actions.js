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
import { TRANSACTION_ERROR, TRANSACTION_SUCCESS } from './constants';

export const enqueueItemAndAutocommit = function* ( queue, context, item ) {
	return yield enqueueAutocommitControl( queue, context, item, true );
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

export const commit = function* ( queue, context, meta = {} ) {
	const transactionId = uuid();
	yield prepareBatchTransaction( queue, context, transactionId, meta );
	const { chunks } = yield select( 'getTransaction', transactionId );

	yield {
		queue,
		context,
		transactionId,
		type: 'COMMIT_START',
	};

	let failed = false;
	for ( const chunkId of Object.keys( chunks ) ) {
		yield {
			transactionId,
			chunkId,
			type: 'COMMIT_CHUNK_START',
		};
		const transaction = yield select( 'getTransaction', transactionId );

		let chunkFailed = false,
			errors,
			exception,
			results;
		try {
			results = yield processChunk( transaction, chunkId );
		} catch ( _exception ) {
			chunkFailed = failed = true;

			// If the error isn't in the expected format, something is wrong - let's rethrow
			if ( ! _exception.isChunkError ) {
				throw _exception;
			}
			exception = _exception;
			errors = exception.errorsById;
			// Don't break the loop as we still need results for any remaining chunks.
			// Queue processor receives the transaction object and may choose whether to
			// process other chunks or short-circuit with an error.
		}

		yield {
			transactionId,
			chunkId,
			results,
			errors,
			exception,
			type: 'COMMIT_CHUNK_FINISH',
			state: chunkFailed ? TRANSACTION_ERROR : TRANSACTION_SUCCESS,
		};
	}

	yield {
		transactionId,
		type: 'COMMIT_FINISH',
		state: failed ? TRANSACTION_ERROR : TRANSACTION_SUCCESS,
	};

	return yield select( 'getTransaction', transactionId );
};

export function prepareBatchTransaction(
	queue,
	context,
	transactionId,
	meta = {}
) {
	return {
		type: 'PREPARE_BATCH_TRANSACTION',
		queue,
		context,
		transactionId,
		meta,
	};
}

export const registerProcessor = function ( queue, callback ) {
	return {
		type: 'REGISTER_PROCESSOR',
		queue,
		callback,
	};
};
