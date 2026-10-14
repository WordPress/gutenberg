/**
 * Sets the active context.
 *
 * @param {string} context Context.
 *
 * @return {Object} action.
 */
export function setContext( context: string ) {
	return {
		type: 'SET_CONTEXT' as const,
		context,
	};
}

/**
 * Sets whether a command loader is currently loading.
 *
 * @param {string}  name      Command loader name.
 * @param {boolean} isLoading Whether the loader is loading.
 *
 * @return {Object} action.
 */
export function setLoaderLoading(
	name: string,
	isLoading: boolean | undefined
) {
	return {
		type: 'SET_LOADER_LOADING' as const,
		name,
		isLoading,
	};
}
