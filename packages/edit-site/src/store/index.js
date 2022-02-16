/**
 * WordPress dependencies
 */
import { createReduxStore, registerStore } from '@wordpress/data';

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
	__experimentalUseThunks: true,
	persist: [ 'preferences' ],
};

export const store = createReduxStore( STORE_NAME, storeConfig );

// Once we build a more generic persistence plugin that works across types of stores
// we'd be able to replace this with a register call.
registerStore( STORE_NAME, storeConfig );
