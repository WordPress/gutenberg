/**
 * WordPress dependencies
 */
import { registerStore } from '@wordpress/data';

/**
 * Internal dependencies
 */
import reducer from './reducer';
import applyMiddlewares from './middlewares';
import * as actions from './actions';
import * as selectors from './selectors';
import { STORE_KEY } from './constants';

const store = registerStore( STORE_KEY, {
	reducer,
	actions,
	selectors,
	persist: [ 'preferences' ],
} );

applyMiddlewares( store );

/**
 * Store registered for the edit post namespace.
 *
 * @see https://github.com/WordPress/gutenberg/blob/master/packages/data/README.md#registerStore
 *
 * @type {Object}
 */
export default store;
