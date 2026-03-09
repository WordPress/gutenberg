import type { store } from './store';

/**
 * Bind the store descriptor to the store name so that string-based
 * access (e.g. `select( 'core/editor' )`) is typed.
 */
declare module '@wordpress/data' {
	interface StoreRegistry {
		'core/editor': typeof store;
	}
}
