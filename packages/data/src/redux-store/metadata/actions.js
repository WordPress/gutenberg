/**
 * Returns an action object used in signalling that selector resolution has
 * started.
 *
 * @param {string}    selectorName Name of selector for which resolver triggered.
 * @param {unknown[]} args         Arguments to associate for uniqueness.
 *
 * @return {{ type: 'START_RESOLUTION', selectorName: string, args: unknown[] }} Action object.
 */
export function startResolution( selectorName, args ) {
	return {
		type: 'START_RESOLUTION',
		selectorName,
		args,
	};
}

/**
 * Returns an action object used in signalling that selector resolution has
 * completed.
 *
 * @param {string}    selectorName Name of selector for which resolver triggered.
 * @param {unknown[]} args         Arguments to associate for uniqueness.
 *
 * @return {{ type: 'FINISH_RESOLUTION', selectorName: string, args: unknown[] }} Action object.
 */
export function finishResolution( selectorName, args ) {
	return {
		type: 'FINISH_RESOLUTION',
		selectorName,
		args,
	};
}

/**
 * Returns an action object used in signalling that a batch of selector resolutions has
 * started.
 *
 * @param {string}    selectorName Name of selector for which resolver triggered.
 * @param {unknown[][]} args         Array of arguments to associate for uniqueness, each item
 *                                 is associated to a resolution.
 *
 * @return {{ type: 'START_RESOLUTIONS', selectorName: string, args: unknown[][] }} Action object.
 */
export function startResolutions( selectorName, args ) {
	return {
		type: 'START_RESOLUTIONS',
		selectorName,
		args,
	};
}

/**
 * Returns an action object used in signalling that a batch of selector resolutions has
 * completed.
 *
 * @param {string}    selectorName Name of selector for which resolver triggered.
 * @param {unknown[][]} args         Array of arguments to associate for uniqueness, each item
 *                                 is associated to a resolution.
 *
 * @return {{ type: 'FINISH_RESOLUTIONS', selectorName: string, args: unknown[][] }} Action object.
 */
export function finishResolutions( selectorName, args ) {
	return {
		type: 'FINISH_RESOLUTIONS',
		selectorName,
		args,
	};
}

/**
 * Returns an action object used in signalling that we should invalidate the resolution cache.
 *
 * @param {string}    selectorName Name of selector for which resolver should be invalidated.
 * @param {unknown[]} args         Arguments to associate for uniqueness.
 *
 * @return {{ type: 'INVALIDATE_RESOLUTION', selectorName: string, args: any[] }} Action object.
 */
export function invalidateResolution( selectorName, args ) {
	return {
		type: 'INVALIDATE_RESOLUTION',
		selectorName,
		args,
	};
}

/**
 * Returns an action object used in signalling that the resolution
 * should be invalidated.
 *
 * @return {{ type: 'INVALIDATE_RESOLUTION_FOR_STORE' }} Action object.
 */
export function invalidateResolutionForStore() {
	return {
		type: 'INVALIDATE_RESOLUTION_FOR_STORE',
	};
}

/**
 * Returns an action object used in signalling that the resolution cache for a
 * given selectorName should be invalidated.
 *
 * @param {string} selectorName Name of selector for which all resolvers should
 *                              be invalidated.
 *
 * @return  {{ type: 'INVALIDATE_RESOLUTION_FOR_STORE_SELECTOR', selectorName: string }} Action object.
 */
export function invalidateResolutionForStoreSelector( selectorName ) {
	return {
		type: 'INVALIDATE_RESOLUTION_FOR_STORE_SELECTOR',
		selectorName,
	};
}
