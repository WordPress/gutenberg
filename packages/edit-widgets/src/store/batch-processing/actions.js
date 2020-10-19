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
