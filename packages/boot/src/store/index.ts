/**
 * WordPress dependencies
 */
import { createReduxStore, register } from '@wordpress/data';

/**
 * Internal dependencies
 */
import { reducer } from './reducer';
import * as actions from './actions';
import * as selectors from './selectors';

const STORE_NAME = 'wordpress/boot';

export const store = createReduxStore( STORE_NAME, {
	reducer,
	actions,
	selectors,
} );

register( store );

export { STORE_NAME };

/**
 * Bind the store descriptor to the store name so that string-based
 * access (e.g. `select( 'wordpress/boot' )`) is typed.
 */
declare module '@wordpress/data' {
	interface StoreRegistry {
		[ STORE_NAME ]: typeof store;
	}
}
