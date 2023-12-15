/**
 * WordPress dependencies
 */
import { createReduxStore, registerStore } from '@wordpress/data';

/**
 * Internal dependencies
 */
import reducer from './reducer';
import * as selectors from './selectors';
import * as privateActions from './private-actions';
import * as privateSelectors from './private-selectors';
import * as actions from './actions';
import * as resolvers from './resolvers';
import { STORE_NAME } from './constants';
import { unlock } from '../lock-unlock';

/**
 * Block editor data store configuration.
 *
 * @see https://github.com/WordPress/gutenberg/blob/HEAD/packages/data/README.md#registerStore
 */
export const storeConfig = {
	reducer,
	selectors,
	actions,
	resolvers,
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
unlock( registeredStore ).registerPrivateActions( privateActions );
unlock( registeredStore ).registerPrivateSelectors( privateSelectors );

// TODO: Remove once we switch to the `register` function (see above).
//
// Until then, private functions also need to be attached to the original
// `store` descriptor in order to avoid unit tests failing, which could happen
// when tests create new registries in which they register stores.
//
// @see https://github.com/WordPress/gutenberg/pull/51145#discussion_r1239999590
unlock( store ).registerPrivateActions( privateActions );
unlock( store ).registerPrivateSelectors( privateSelectors );
