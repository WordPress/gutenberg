/**
 * WordPress dependencies
 */
import { createReduxStore, registerStore } from '@wordpress/data';
import { controls } from '@wordpress/data-controls';

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
	controls,
	persist: [ 'preferences' ],
};

/**
 * Store definition for the edit post namespace.
 *
 * @see https://github.com/WordPress/gutenberg/blob/HEAD/packages/data/README.md#createReduxStore
 *
 * @type {Object}
 */
export const store = createReduxStore( STORE_NAME, storeConfig );

// Ideally we use register instead of register store.
registerStore( STORE_NAME, storeConfig );
