/**
 * WordPress dependencies
 */
import { createReduxStore, register } from '@wordpress/data';

/**
 * Internal dependencies
 */
import reducer from './reducer';
import * as actions from './actions';
import * as privateActions from './private-actions';
import * as selectors from './selectors';
import * as privateSelectors from './private-selectors';
import { STORE_NAME } from './constants';
import { unlock } from '../lock-unlock';

export const storeConfig = {
	reducer,
	actions,
	selectors,
};

export const store = createReduxStore( STORE_NAME, storeConfig );
register( store );
unlock( store ).registerPrivateSelectors( privateSelectors );
unlock( store ).registerPrivateActions( privateActions );
