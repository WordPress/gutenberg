/**
 * WordPress dependencies
 */
import { registerStore } from '@wordpress/data';

/**
 * Internal dependencies
 */
import reducer from './reducer';
import * as actions from './actions';
import { STORE_KEY } from './constants';
import applyMiddlewares from './middlewares';

/**
 * Data store configuration.
 *
 * @see https://github.com/WordPress/gutenberg/blob/master/packages/data/README.md#registerStore
 *
 * @type {Object}
 */
export const storeConfig = {
	reducer,
	actions,
};

const store = registerStore( STORE_KEY, {
	...storeConfig,
	persist: [ 'preferences' ],
} );
applyMiddlewares( store );

export default store;
