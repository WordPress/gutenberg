/**
 * WordPress dependencies
 */
import { createReduxStore, registerStore } from '@wordpress/data';

/**
 * Internal dependencies
 */
import reducer from './reducer';
import * as selectors from './selectors';
import * as actions from './actions';
import { STORE_NAME } from './constants';

/**
 * Block editor data store configuration.
 *
 * @see https://github.com/WordPress/gutenberg/blob/HEAD/packages/data/README.md#registerStore
 *
 * @type {Object}
 */
export const storeConfig = {
	reducer,
	selectors,
	actions,
	__experimentalUseThunks: true,
};

/**
 * Store definition for the block editor namespace.
 *
 * @see https://github.com/WordPress/gutenberg/blob/HEAD/packages/data/README.md#createReduxStore
 *
 * @type {Object}
 */
export const store = createReduxStore( STORE_NAME, {
	...storeConfig,
	persist: [ 'preferences' ],
} );

// Ideally we'd use register instead of register stores.
registerStore( STORE_NAME, {
	...storeConfig,
	persist: [ 'preferences' ],
} );
