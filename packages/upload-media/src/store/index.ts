/**
 * WordPress dependencies
 */
import { createReduxStore, register } from '@wordpress/data';

/**
 * Internal dependencies
 */
import reducer from './reducer';
import * as selectors from './selectors';
import * as privateSelectors from './private-selectors';
import * as actions from './actions';
import * as privateActions from './private-actions';
import { unlock } from '../lock-unlock';

export const STORE_NAME = 'core/upload-media';

export const store = createReduxStore( STORE_NAME, {
	reducer,
	selectors,
	actions,
} );

register( store );
unlock( store ).registerPrivateActions( privateActions );
unlock( store ).registerPrivateSelectors( privateSelectors );
