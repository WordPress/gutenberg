/**
 * Internal dependencies
 */
import validateHookName from './validateHookName.js';

/**
 * @callback DidHook
 *
 * Returns the number of times an action has been fired.
 *
 * @param  {string} hookName The hook name to check.
 *
 * @return {number|undefined}          The number of times the hook has run.
 */

/**
 * Returns a function which, when invoked, will return the number of times a
 * hook has been called.
 *
 * @param  {import('.').Hooks}   hooks Stored hooks, keyed by hook name.
 *
 * @return {DidHook}       Function that returns a hook's call count.
 */
function createDidHook( hooks ) {
	return function didHook( hookName ) {
		if ( ! validateHookName( hookName ) ) {
			return;
		}

		return hooks[ hookName ] && hooks[ hookName ].runs
			? hooks[ hookName ].runs
			: 0;
	};
}

export default createDidHook;
