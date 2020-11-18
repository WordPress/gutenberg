/**
 * WordPress dependencies
 */
import { createReduxStore, registerStore } from '@wordpress/data';

/**
 * Internal dependencies
 */
import reducer from './reducer';
import * as actions from './actions';
import * as selectors from './selectors';
import { STORE_NAME } from './constants';

const storeConfig = {
	reducer,
	actions,
	selectors,
	persist: [ 'preferences' ],
};

/**
 * Store definition for the edit post namespace.
 *
 * @see https://github.com/WordPress/gutenberg/blob/master/packages/data/README.md#createReduxStore
 *
 * @type {Object}
 */
export const store = createReduxStore( STORE_NAME, storeConfig );

// Ideally we use register instead of register store.
// We shouuld be able to make the switch once we remove the effects.
const instantiatedStore = registerStore( STORE_NAME, storeConfig );

export default instantiatedStore;
