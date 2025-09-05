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
import { STORE_NAME } from './constants';

/**
 * Media upload data store configuration.
 *
 * @see https://github.com/WordPress/gutenberg/blob/HEAD/packages/data/README.md#registerStore
 */
export const storeConfig = {
	reducer,
	selectors,
	actions,
};

/**
 * Store definition for the media upload namespace.
 *
 * @see https://github.com/WordPress/gutenberg/blob/HEAD/packages/data/README.md#createReduxStore
 */
export const store = createReduxStore( STORE_NAME, {
	reducer,
	selectors,
	actions,
} );

register( store );
// @ts-ignore
unlock( store ).registerPrivateActions( privateActions );
// @ts-ignore
unlock( store ).registerPrivateSelectors( privateSelectors );
