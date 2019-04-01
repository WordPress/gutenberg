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
import controls from './controls';
import { STORE_KEY } from './constants';

const store = registerStore( STORE_KEY, {
	reducer,
	actions,
	selectors,
	controls,
	persist: [ 'preferences' ],
} );

applyMiddlewares( store );
store.dispatch( actions.init() );

export default store;
