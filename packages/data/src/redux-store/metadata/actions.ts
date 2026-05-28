/**
 * Returns an action object used in signalling that selector resolution has
 * started.
 *
 * @param selectorName Name of selector for which resolver triggered.
 * @param args         Arguments to associate for uniqueness.
 *
 * @return Action object.
 */
export function startResolution( selectorName: string, args: unknown[] ) {
	return {
		type: 'START_RESOLUTION',
		selectorName,
		args,
	} as const;
}

/**
 * Returns an action object used in signalling that selector resolution has
 * completed.
 *
 * @param selectorName Name of selector for which resolver triggered.
 * @param args         Arguments to associate for uniqueness.
 *
 * @return Action object.
 */
export function finishResolution( selectorName: string, args: unknown[] ) {
	return {
		type: 'FINISH_RESOLUTION',
		selectorName,
		args,
	} as const;
}

/**
 * Returns an action object used in signalling that selector resolution has
 * failed.
 *
 * @param selectorName Name of selector for which resolver triggered.
 * @param args         Arguments to associate for uniqueness.
 * @param error        The error that caused the failure.
 *
 * @return Action object.
 */
export function failResolution(
	selectorName: string,
	args: unknown[],
	error: Error | unknown
) {
	return {
		type: 'FAIL_RESOLUTION',
		selectorName,
		args,
		error,
	} as const;
}

/**
 * Returns an action object used in signalling that a batch of selector resolutions has
 * started.
 *
 * @param selectorName Name of selector for which resolver triggered.
 * @param args         Array of arguments to associate for uniqueness, each item
 *                     is associated to a resolution.
 *
 * @return Action object.
 */
export function startResolutions( selectorName: string, args: unknown[][] ) {
	return {
		type: 'START_RESOLUTIONS',
		selectorName,
		args,
	} as const;
}

/**
 * Returns an action object used in signalling that a batch of selector resolutions has
 * completed.
 *
 * @param selectorName Name of selector for which resolver triggered.
 * @param args         Array of arguments to associate for uniqueness, each item
 *                     is associated to a resolution.
 *
 * @return Action object.
 */
export function finishResolutions( selectorName: string, args: unknown[][] ) {
	return {
		type: 'FINISH_RESOLUTIONS',
		selectorName,
		args,
	} as const;
}

/**
 * Returns an action object used in signalling that a batch of selector resolutions has
 * completed and at least one of them has failed.
 *
 * @param selectorName Name of selector for which resolver triggered.
 * @param args         Array of arguments to associate for uniqueness, each item
 *                     is associated to a resolution.
 * @param errors       Array of errors to associate for uniqueness, each item
 *                     is associated to a resolution.
 * @return Action object.
 */
export function failResolutions(
	selectorName: string,
	args: unknown[],
	errors: ( Error | unknown )[]
) {
	return {
		type: 'FAIL_RESOLUTIONS',
		selectorName,
		args,
		errors,
	} as const;
}

/**
 * Returns an action object used in signalling that we should invalidate the resolution cache.
 *
 * @param selectorName Name of selector for which resolver should be invalidated.
 * @param args         Arguments to associate for uniqueness.
 *
 * @return Action object.
 */
export function invalidateResolution( selectorName: string, args: unknown[] ) {
	return {
		type: 'INVALIDATE_RESOLUTION',
		selectorName,
		args,
	} as const;
}

/**
 * Returns an action object used in signalling that the resolution
 * should be invalidated.
 *
 * @return Action object.
 */
export function invalidateResolutionForStore() {
	return {
		type: 'INVALIDATE_RESOLUTION_FOR_STORE',
	} as const;
}

/**
 * Returns an action object used in signalling that the resolution cache for a
 * given selectorName should be invalidated.
 *
 * @param selectorName Name of selector for which all resolvers should
 *                     be invalidated.
 *
 * @return Action object.
 */
export function invalidateResolutionForStoreSelector( selectorName: string ) {
	return {
		type: 'INVALIDATE_RESOLUTION_FOR_STORE_SELECTOR',
		selectorName,
	} as const;
}
