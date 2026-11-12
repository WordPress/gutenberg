import type { State } from './types';

/**
 * Returns whether any command loader is currently loading.
 *
 * @param {Object} state State tree.
 *
 * @return {boolean} Whether any loader is loading.
 */
export function isLoading( state: State ) {
	// A loader that unregistered mid-load never reports that it finished.
	return Object.entries( state.loaderStates ).some(
		( [ name, loading ] ) => loading && !! state.commandLoaders[ name ]
	);
}
