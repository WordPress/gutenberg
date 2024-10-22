/**
 * @callback DoingHook
 * Returns whether a hook is currently being executed.
 *
 * @param {string} [hookName] The name of the hook to check for.  If
 *                            omitted, will check for any hook being executed.
 *
 * @return {boolean} Whether the hook is being executed.
 */

/**
 * Returns a function which, when invoked, will return whether a hook is
 * currently being executed.
 *
 * @param {import('.').Hooks}    hooks    Hooks instance.
 * @param {import('.').StoreKey} storeKey
 *
 * @return {DoingHook} Function that returns whether a hook is currently
 *                     being executed.
 */
function createDoingHook( hooks, storeKey ) {
	return function doingHook( hookName ) {
		const hooksStore = hooks[ storeKey ];

		// If the hookName was not passed, check for any current hook.
		if ( 'undefined' === typeof hookName ) {
			return hooksStore.__current.size > 0;
		}

		// Find if the `hookName` hook is in `__current`.
		return Array.from( hooksStore.__current ).some(
			( hook ) => hook.name === hookName
		);
	};
}

export default createDoingHook;
