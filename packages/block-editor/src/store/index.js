/**
 * WordPress dependencies
 */
import { registerStore } from '@wordpress/data';

/**
 * Internal dependencies
 */
import reducer from './reducer';
import applyMiddlewares from './middlewares';
import * as selectors from './selectors';
import * as actions from './actions';
import controls from './controls';
import { STORE_KEY } from './constants';

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

const store = registerStore( STORE_KEY, {
	...storeConfig,
	persist: [ 'preferences' ],
} );
applyMiddlewares( store );

export { STORE_KEY as BLOCK_EDITOR_STORE_KEY };

export default store;
