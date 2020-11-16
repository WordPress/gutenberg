/**
 * WordPress dependencies
 */
import { createReduxStoreDefinition, registerStore } from '@wordpress/data';

/**
 * Internal dependencies
 */
import reducer from './reducer';
import applyMiddlewares from './middlewares';
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
 * @see https://github.com/WordPress/gutenberg/blob/master/packages/data/README.md#createReduxStoreDefinition
 *
 * @type {Object}
 */
export const storeDefinition = createReduxStoreDefinition(
	STORE_NAME,
	storeConfig
);

// Ideally we use register instead of register store.
// We shouuld be able to make the switch once we remove the effects.
const store = registerStore( STORE_NAME, storeConfig );
applyMiddlewares( store );
