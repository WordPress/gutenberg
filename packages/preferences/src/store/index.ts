/**
 * WordPress dependencies
 */
import { createReduxStore, register } from '@wordpress/data';

/**
 * Internal dependencies
 */
import reducer from './reducer';
import * as actions from './actions';
import * as selectors from './selectors';
import { STORE_NAME } from './constants';
import type { StoreState } from './types';

/**
 * Store definition for the preferences namespace.
 *
 * @see https://github.com/WordPress/gutenberg/blob/HEAD/packages/data/README.md#createReduxStore
 */
export const store = createReduxStore<
	StoreState,
	typeof actions,
	typeof selectors
>( STORE_NAME, {
	reducer,
	actions,
	selectors,
} );

register( store );

/**
 * Bind the store descriptor to the store name so that string-based
 * access (e.g. `select( 'core/preferences' )`) is typed.
 */
declare module '@wordpress/data' {
	interface StoreRegistry {
		[ STORE_NAME ]: typeof store;
	}
}
