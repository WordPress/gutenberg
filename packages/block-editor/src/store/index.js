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
import resolvers from './resolvers';
import controls from './controls';

/**
 * Module Constants
 */
const MODULE_KEY = 'core/block-editor';

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
	resolvers,
};

const store = registerStore( MODULE_KEY, {
	...storeConfig,
	persist: [ 'preferences' ],
} );
applyMiddlewares( store );

export default store;
