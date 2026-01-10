/**
 * Internal dependencies
 */
import type { Hooks, StoreKey } from './types';
/**
 *
 * Returns whether any handlers are attached for the given hookName and optional namespace.
 */
export type HasHook = (
	/**
	 * The name of the hook to check for.
	 */
	hookname: string,
	/**
	 * The unique namespace identifying the callback in the form `vendor/plugin/function`.
	 */
	namespace?: string
) => boolean;

/**
 * Returns a function which, when invoked, will return whether any handlers are
 * attached to a particular hook.
 *
 * @param hooks    Hooks instance.
 * @param storeKey
 *
 * @return  Function that returns whether any handlers are
 *                   attached to a particular hook and optional namespace.
 */
function createHasHook( hooks: Hooks, storeKey: StoreKey ): HasHook {
	return function hasHook( hookName, namespace ) {
		const hooksStore = hooks[ storeKey ];

		// Use the namespace if provided.
		if ( 'undefined' !== typeof namespace ) {
			return (
				hookName in hooksStore &&
				hooksStore[ hookName ].handlers.some(
					( hook ) => hook.namespace === namespace
				)
			);
		}

		return hookName in hooksStore;
	};
}

export default createHasHook;
