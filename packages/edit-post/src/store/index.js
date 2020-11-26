/**
 * WordPress dependencies
 */
import { createReduxStore, registerStore } from '@wordpress/data';

/**
 * Internal dependencies
 */
import reducer from './reducer';
import controls from './controls';
import * as actions from './actions';
import * as selectors from './selectors';
import { STORE_NAME } from './constants';

const storeConfig = {
	reducer,
	actions,
	controls,
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
registerStore( STORE_NAME, storeConfig );
