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
import * as generalActions from './actions.js';
import * as actions from './actions/index.js';
import controls from './controls';
import { MODULE_KEY } from './constants';

const store = registerStore( MODULE_KEY, {
	reducer,
	controls,
	selectors,
	actions: { ...actions, ...generalActions },
	controls,
	persist: [ 'preferences' ],
} );
applyMiddlewares( store );

export default store;
