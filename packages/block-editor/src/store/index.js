/**
 * WordPress dependencies
 */
import { createReduxStore, registerStore } from '@wordpress/data';

/**
 * Internal dependencies
 */
import reducer from './reducer';
import * as selectors from './selectors';
import * as allActions from './actions';
import { STORE_NAME } from './constants';
import { unlock } from '../experiments';

const { __experimentalUpdateSettings, ...actions } = allActions;

/**
 * Block editor data store configuration.
 *
 * @see https://github.com/WordPress/gutenberg/blob/HEAD/packages/data/README.md#registerStore
 */
export const storeConfig = {
	reducer,
	selectors,
	actions,
};

/**
 * Store definition for the block editor namespace.
 *
 * @see https://github.com/WordPress/gutenberg/blob/HEAD/packages/data/README.md#createReduxStore
 */
export const store = createReduxStore( STORE_NAME, {
	...storeConfig,
	persist: [ 'preferences' ],
} );

// We will be able to use the `register` function once we switch
// the "preferences" persistence to use the new preferences package.
const registeredStore = registerStore( STORE_NAME, {
	...storeConfig,
	persist: [ 'preferences' ],
} );

unlock( registeredStore ).registerPrivateActions( {
	__experimentalUpdateSettings,
} );
