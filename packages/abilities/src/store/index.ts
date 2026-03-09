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

/**
 * The abilities store definition.
 */
export const store = createReduxStore( STORE_NAME, {
	reducer,
	actions,
	selectors,
} );

register( store );

/**
 * Bind the store descriptor to the store name so that string-based
 * access (e.g. `select( 'core/abilities' )`) is typed.
 */
declare module '@wordpress/data' {
	interface StoreRegistry {
		[ STORE_NAME ]: typeof store;
	}
}
