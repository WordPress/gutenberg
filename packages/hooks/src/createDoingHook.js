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
			return 'undefined' !== typeof hooksStore.__current[ 0 ];
		}

		// Return the __current hook.
		return hooksStore.__current[ 0 ]
			? hookName === hooksStore.__current[ 0 ].name
			: false;
	};
}

export default createDoingHook;
