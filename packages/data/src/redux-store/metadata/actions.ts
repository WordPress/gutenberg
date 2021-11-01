type SelectorWrapper<
	ActionName extends string = string,
	SelectorName extends string = string,
	Args extends unknown[] = unknown[]
> = (
	selectorName: SelectorName,
	args: Args
) => {
	type: ActionName;
	selectorName: SelectorName;
	args: Args;
};

/**
 * Returns an action object used in signalling that selector resolution has
 * started.
 *
 * @param  selectorName Name of selector for which resolver triggered.
 * @param  args         Arguments to associate for uniqueness.
 *
 * @return Action object.
 */
export const startResolution: SelectorWrapper< 'START_RESOLUTION' > = (
	selectorName,
	args
) => ( {
	type: 'START_RESOLUTION',
	selectorName,
	args,
} );

/**
 * Returns an action object used in signalling that selector resolution has
 * completed.
 *
 * @param  selectorName Name of selector for which resolver triggered.
 * @param  args         Arguments to associate for uniqueness.
 *
 * @return Action object.
 */
export const finishResolution: SelectorWrapper< 'FINISH_RESOLUTION' > = (
	selectorName,
	args
) => ( {
	type: 'FINISH_RESOLUTION',
	selectorName,
	args,
} );

/**
 * Returns an action object used in signalling that a batch of selector resolutions has
 * started.
 *
 * @param  selectorName Name of selector for which resolver triggered.
 * @param  args         Array of arguments to associate for uniqueness, each item
 *                      is associated to a resolution.
 *
 * @return  Action object.
 */
export const startResolutions: SelectorWrapper< 'START_RESOLUTIONS' > = (
	selectorName,
	args
) => ( {
	type: 'START_RESOLUTIONS',
	selectorName,
	args,
} );

/**
 * Returns an action object used in signalling that a batch of selector resolutions has
 * completed.
 *
 * @param  selectorName Name of selector for which resolver triggered.
 * @param  args         Array of arguments to associate for uniqueness, each item
 *                      is associated to a resolution.
 *
 * @return  Action object.
 */
export const finishResolutions: SelectorWrapper< 'FINISH_RESOLUTIONS' > = (
	selectorName,
	args
) => ( {
	type: 'FINISH_RESOLUTIONS',
	selectorName,
	args,
} );

/**
 * Returns an action object used in signalling that we should invalidate the resolution cache.
 *
 * @param  selectorName Name of selector for which resolver should be invalidated.
 * @param  args         Arguments to associate for uniqueness.
 *
 * @return  Action object.
 */
export const invalidateResolution: SelectorWrapper< 'INVALIDATE_RESOLUTION' > = (
	selectorName,
	args
) => ( {
	type: 'INVALIDATE_RESOLUTION',
	selectorName,
	args,
} );

/**
 * Returns an action object used in signalling that the resolution
 * should be invalidated.
 *
 * @return Action object.
 */
export function invalidateResolutionForStore() {
	return {
		type: 'INVALIDATE_RESOLUTION_FOR_STORE' as const,
	};
}

/**
 * Returns an action object used in signalling that the resolution cache for a
 * given selectorName should be invalidated.
 *
 * @param  selectorName Name of selector for which all resolvers should
 *                      be invalidated.
 *
 * @return  Action object.
 */
export function invalidateResolutionForStoreSelector<
	SelectorName extends string
>( selectorName: SelectorName ) {
	return {
		type: 'INVALIDATE_RESOLUTION_FOR_STORE_SELECTOR' as const,
		selectorName,
	};
}
