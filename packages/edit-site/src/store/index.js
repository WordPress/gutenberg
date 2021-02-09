/**
 * WordPress dependencies
 */
import { createReduxStore, register } from '@wordpress/data';
import { controls } from '@wordpress/data-controls';

/**
 * Internal dependencies
 */
import reducer from './reducer';
import * as actions from './actions';
import * as selectors from './selectors';
import { STORE_NAME } from './constants';

export const storeConfig = {
	reducer,
	actions,
	selectors,
	controls,
	persist: [ 'preferences' ],
};

export const store = createReduxStore( STORE_NAME, storeConfig );

register( store );
