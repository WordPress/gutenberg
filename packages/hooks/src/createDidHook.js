/**
 * Internal dependencies
 */
import validateHookName from './validateHookName.js';

/**
 * @callback DidHook
 *
 * Returns the number of times an action has been fired.
 *
 * @param {string} hookName The hook name to check.
 *
 * @return {number | undefined} The number of times the hook has run.
 */

/**
 * Returns a function which, when invoked, will return the number of times a
 * hook has been called.
 *
 * @param {import('.').Hooks}    hooks    Hooks instance.
 * @param {import('.').StoreKey} storeKey
 *
 * @return {DidHook} Function that returns a hook's call count.
 */
function createDidHook( hooks, storeKey ) {
	return function didHook( hookName ) {
		const hooksStore = hooks[ storeKey ];

		if ( ! validateHookName( hookName ) ) {
			return;
		}

		return hooksStore[ hookName ] && hooksStore[ hookName ].runs
			? hooksStore[ hookName ].runs
			: 0;
	};
}

export default createDidHook;
