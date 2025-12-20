/**
 * Sets the active context.
 *
 * @param {string} context Context.
 *
 * @return {Object} action.
 */
export function setContext( context ) {
	return {
		type: 'SET_CONTEXT',
		context,
	};
}
