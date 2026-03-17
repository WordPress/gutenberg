/**
 * Internal dependencies
 */
import validateHookName from './validateHookName';
import type { Hooks, StoreKey } from './types';

/**
 *
 * Returns the number of times an action has been fired.
 *
 */
export type DidHook = (
	/**
	 * The hook name to check.
	 */
	hookName: string
) => number | undefined;

/**
 * Returns a function which, when invoked, will return the number of times a
 * hook has been called.
 *
 * @param hooks    Hooks instance.
 * @param storeKey
 *
 * @return  Function that returns a hook's call count.
 */
function createDidHook( hooks: Hooks, storeKey: StoreKey ): DidHook {
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
