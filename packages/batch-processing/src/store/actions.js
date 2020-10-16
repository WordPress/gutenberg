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
	processTransaction,
} from './controls';
import { STATE_ERROR, STATE_SUCCESS } from './constants';

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

export const processBatch = function* ( queue, context, meta = {} ) {
	const batchId = uuid();
	yield prepareBatchForProcessing( queue, context, batchId, meta );
	const { transactions } = yield select( 'getBatch', batchId );

	yield {
		queue,
		context,
		batchId,
		type: 'BATCH_START',
	};

	let failed = false;
	for ( const transactionId of Object.keys( transactions ) ) {
		const result = yield* commitTransaction( batchId, transactionId );
		if ( result.state === STATE_ERROR ) {
			failed = true;
		}
	}

	yield {
		batchId,
		type: 'BATCH_FINISH',
		state: failed ? STATE_ERROR : STATE_SUCCESS,
	};

	return yield select( 'getBatch', batchId );
};

export function* commitTransaction( batchId, transactionId ) {
	yield {
		batchId,
		transactionId,
		type: 'COMMIT_TRANSACTION_START',
	};
	const batch = yield select( 'getBatch', batchId );

	let failed = false,
		errors,
		exception,
		results;
	try {
		results = yield processTransaction( batch, transactionId );
	} catch ( _exception ) {
		failed = true;

		// If the error isn't in the expected format, something is wrong - let's rethrow
		if ( ! _exception.isTransactionError ) {
			throw _exception;
		}
		exception = _exception;
		errors = exception.errorsById;
		// Don't break the loop as we still need results for any remaining transactions.
		// Queue processor receives the batch object and may choose whether to
		// process other transactions or short-circuit with an error.
	}

	const finishedAction = {
		batchId,
		transactionId,
		results,
		errors,
		exception,
		type: 'COMMIT_TRANSACTION_FINISH',
		state: failed ? STATE_ERROR : STATE_SUCCESS,
	};

	yield finishedAction;
	return finishedAction;
}

export function prepareBatchForProcessing(
	queue,
	context,
	batchId,
	meta = {}
) {
	return {
		type: 'PREPARE_BATCH_FOR_PROCESSING',
		queue,
		context,
		batchId,
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
