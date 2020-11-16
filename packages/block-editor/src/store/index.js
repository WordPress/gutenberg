/**
 * WordPress dependencies
 */
import { createReduxStoreDefinition, registerStore } from '@wordpress/data';

/**
 * Internal dependencies
 */
import reducer from './reducer';
import applyMiddlewares from './middlewares';
import * as selectors from './selectors';
import * as actions from './actions';
import controls from './controls';

/**
 * Module Constants
 */
const STORE_NAME = 'core/block-editor';

/**
 * Block editor data store configuration.
 *
 * @see https://github.com/WordPress/gutenberg/blob/master/packages/data/README.md#registerStore
 *
 * @type {Object}
 */
export const storeConfig = {
	reducer,
	selectors,
	actions,
	controls,
};

/**
 * Store definition for the block editor namespace.
 *
 * @see https://github.com/WordPress/gutenberg/blob/master/packages/data/README.md#createReduxStoreDefinition
 *
 * @type {Object}
 */
export const storeDefinition = createReduxStoreDefinition( STORE_NAME, {
	...storeConfig,
	persist: [ 'preferences' ],
} );

// Ideally we'd use register instead of register stores.
// We should be able to make the switch once we remove the "effects" middleware.
const store = registerStore( STORE_NAME, {
	...storeConfig,
	persist: [ 'preferences' ],
} );
applyMiddlewares( store );
