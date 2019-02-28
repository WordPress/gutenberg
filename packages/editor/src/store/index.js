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
const MODULE_KEY = 'core/editor';

const store = registerStore( MODULE_KEY, {
	reducer,
	selectors,
	actions,
	controls,
	persist: [ 'preferences' ],
} );
applyMiddlewares( store );

export default store;
