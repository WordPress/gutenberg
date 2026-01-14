/**
 * WordPress dependencies
 */
import { createReduxStore, register, select } from '@wordpress/data';

/**
 * Internal dependencies
 */
import reducer from './reducer';
import * as actions from './actions';
import * as selectors from './selectors';
import * as resolvers from './resolvers';

/**
 * Store name.
 */
export const STORE_NAME = 'content-guidelines';

/**
 * Store configuration.
 */
const storeConfig = {
	reducer,
	actions,
	selectors,
	resolvers,
};

/**
 * Create and register the store.
 * Guard against double registration when imported from multiple entry points.
 */
export const store = createReduxStore( STORE_NAME, storeConfig );

// Only register if not already registered.
try {
	// Check if store exists by attempting to select from it.
	const existingStore = select( STORE_NAME );
	if ( ! existingStore ) {
		register( store );
	}
} catch ( e ) {
	// Store doesn't exist, register it.
	register( store );
}

export default store;
