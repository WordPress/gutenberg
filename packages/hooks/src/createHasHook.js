/**
 * Returns a function which, when invoked, will return whether any handlers are
 * attached to a particular hook.
 *
 * @param  {Object}   hooks Stored hooks, keyed by hook name.
 *
 * @return {Function}       Function that returns whether any handlers are
 *                          attached to a particular hook and optional namespace.
 */
function createHasHook( hooks ) {
	/**
	 * Returns whether any handlers are attached for the given hookName and optional namespace.
	 *
	 * @param {string}  hookName  The name of the hook to check for.
	 * @param {?string} namespace Optional. The unique namespace identifying the callback
	 *                                      in the form `vendor/plugin/function`.
	 *
	 * @return {boolean} Whether there are handlers that are attached to the given hook.
	 */
	return function hasHook( hookName, namespace ) {
		// Use the namespace if provided.
		if ( 'undefined' !== typeof namespace ) {
			return hookName in hooks &&
				hooks[ hookName ].handlers.some( ( hook ) => hook.namespace === namespace );
		}

		return hookName in hooks;
	};
}

export default createHasHook;
