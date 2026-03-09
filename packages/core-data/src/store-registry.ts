import type { store } from './store';

/**
 * Bind the store descriptor to the store name so that string-based
 * access (e.g. `select( 'core' )`) is typed.
 */
declare module '@wordpress/data' {
	interface StoreRegistry {
		core: typeof store;
	}
}
