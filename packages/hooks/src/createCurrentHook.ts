/**
 * Internal dependencies
 */
import type { Hooks, StoreKey } from './types';

/**
 * Returns a function which, when invoked, will return the name of the
 * currently running hook, or `null` if no hook of the given type is currently
 * running.
 *
 * @param hooks    Hooks instance.
 * @param storeKey
 *
 * @return Function that returns the current hook name or null.
 */
function createCurrentHook(
	hooks: Hooks,
	storeKey: StoreKey
): () => string | null {
	return function currentHook() {
		const hooksStore = hooks[ storeKey ];
		const currentArray = Array.from( hooksStore.__current );
		return currentArray.at( -1 )?.name ?? null;
	};
}

export default createCurrentHook;
