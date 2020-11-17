/**
 * External dependencies
 */
import { v4 as uuid } from 'uuid';

/**
 * Internal dependencies
 */
import {
	select,
	dispatch,
	enqueueItemAndAutocommit as enqueueAutocommitControl,
	processTransaction,
} from './controls';
import { STATE_ERROR, STATE_SUCCESS } from './constants';

export const enqueueItemAndAutocommit = function* ( queue, context, item ) {
	return yield enqueueAutocommitControl( queue, context, item );
};

export const enqueueItemAndWaitForResults = function* ( queue, context, item ) {
	const { itemId } = yield dispatch( 'enqueueItem', queue, context, item );
	const { promise } = yield* getOrSetupPromise( queue, context );

	return {
		wait: promise.then( ( batch ) => {
			if ( batch.state === STATE_ERROR ) {
				throw batch.errors[ itemId ];
			}

			return batch.results[ itemId ];
		} ),
	};
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

const setupPromise = function ( queue, context ) {
	const action = {
		type: 'SETUP_PROMISE',
		queue,
		context,
	};

	action.promise = new Promise( ( resolve, reject ) => {
		action.resolve = resolve;
		action.reject = reject;
	} );

	return action;
};

const getOrSetupPromise = function* ( queue, context ) {
	const promise = yield select( 'getPromise', queue, context );

	if ( promise ) {
		return promise;
	}

	yield setupPromise( queue, context );

	return yield select( 'getPromise', queue, context );
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
			// Don't break the loop as we still need results for any remaining transactions.
			// Queue processor receives the batch object and may choose whether to
			// process other transactions or short-circuit with an error.
		}
	}

	const promise = yield select( 'getPromise', queue, context );
	yield {
		queue,
		context,
		batchId,
		type: 'BATCH_FINISH',
		state: failed ? STATE_ERROR : STATE_SUCCESS,
	};
	const batch = yield select( 'getBatch', batchId );

	if ( promise ) {
		promise.resolve( batch );
	}

	return batch;
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
