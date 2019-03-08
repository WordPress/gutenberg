/**
 * Returns an action object used in signalling that selector resolution has
 * started.
 *
 * @param {string} reducerKey   Registered store reducer key.
 * @param {string} selectorName Name of selector for which resolver triggered.
 * @param {...*}   args         Arguments to associate for uniqueness.
 *
 * @return {Object} Action object.
 */
export function startResolution( reducerKey, selectorName, args ) {
	return {
		type: 'START_RESOLUTION',
		reducerKey,
		selectorName,
		args,
	};
}

/**
 * Returns an action object used in signalling that selector resolution has
 * completed.
 *
 * @param {string} reducerKey   Registered store reducer key.
 * @param {string} selectorName Name of selector for which resolver triggered.
 * @param {...*}   args         Arguments to associate for uniqueness.
 *
 * @return {Object} Action object.
 */
export function finishResolution( reducerKey, selectorName, args ) {
	return {
		type: 'FINISH_RESOLUTION',
		reducerKey,
		selectorName,
		args,
	};
}

/**
 * Returns an action object used in signalling that we should invalidate the resolution cache.
 *
 * @param {string} reducerKey   Registered store reducer key.
 * @param {string} selectorName Name of selector for which resolver should be invalidated.
 * @param {Array}  args         Arguments to associate for uniqueness.
 *
 * @return {Object} Action object.
 */
export function invalidateResolution( reducerKey, selectorName, args ) {
	return {
		type: 'INVALIDATE_RESOLUTION',
		reducerKey,
		selectorName,
		args,
	};
}

/**
 * Returns an action object used in signalling that the resolution cache for a
 * given reducerKey should be invalidated.
 *
 * @param {string} reducerKey Registered store reducer key.
 *
 * @return {Object} Action object.
 */
export function invalidateResolutionForStore( reducerKey ) {
	return {
		type: 'INVALIDATE_RESOLUTION_FOR_STORE',
		reducerKey,
	};
}

/**
 * Returns an action object used in signalling that the resolution cache for a
 * given reducerKey and selectorName should be invalidated.
 *
 * @param {string} reducerKey   Registered store reducer key.
 * @param {string} selectorName Name of selector for which all resolvers should
 *                              be invalidated.
 *
 * @return  {Object} Action object.
 */
export function invalidateResolutionForStoreSelector(
	reducerKey,
	selectorName
) {
	return {
		type: 'INVALIDATE_RESOLUTION_FOR_STORE_SELECTOR',
		reducerKey,
		selectorName,
	};
}
