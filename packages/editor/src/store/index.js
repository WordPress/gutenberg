/**
 * WordPress Dependencies
 */
import { registerStore } from '@wordpress/data';

/**
 * Internal dependencies
 */
import reducer from './reducer';
import applyMiddlewares from './middlewares';
import * as selectors from './selectors';
import * as actions from './actions';

/**
 * Module Constants
 */
const MODULE_KEY = 'core/editor';

const store = registerStore( MODULE_KEY, {
	reducer,
	selectors,
	actions,
	persist: [ 'preferences' ],
} );
applyMiddlewares( store );

export default store;
