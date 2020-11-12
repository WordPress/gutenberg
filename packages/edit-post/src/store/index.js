/**
 * WordPress dependencies
 */
import { createStoreDefinition, registerStore } from '@wordpress/data';

/**
 * Internal dependencies
 */
import reducer from './reducer';
import applyMiddlewares from './middlewares';
import * as actions from './actions';
import * as selectors from './selectors';
import { STORE_NAME } from './constants';

/**
 * Store definition for the edit post namespace.
 *
 * @see https://github.com/WordPress/gutenberg/blob/master/packages/data/README.md#createStoreDefinition
 *
 * @type {Object}
 */
export const storeDefinition = createStoreDefinition( STORE_NAME );

const store = registerStore( STORE_NAME, {
	reducer,
	actions,
	selectors,
	persist: [ 'preferences' ],
} );

applyMiddlewares( store );

export default store;
