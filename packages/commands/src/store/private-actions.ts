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

export type PrivateActions = ReturnType< typeof setContext >;
