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

/**
 * Module Constants
 */
const MODULE_KEY = 'core/block-editor';

export const storeConfig = {
	reducer,
	selectors,
	actions,
	controls,
};

const store = registerStore( MODULE_KEY, {
	...storeConfig,
	persist: [ 'preferences' ],
} );
applyMiddlewares( store );

export default store;
