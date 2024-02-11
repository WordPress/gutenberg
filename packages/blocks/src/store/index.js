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
import { STORE_NAME } from './constants';
import { unlock } from '../lock-unlock';

/**
 * Store definition for the blocks namespace.
 *
 * @see https://github.com/WordPress/gutenberg/blob/HEAD/packages/data/README.md#createReduxStore
 *
 * @type {Object}
 */
export const store = createReduxStore( STORE_NAME, {
	reducer,
	selectors,
	actions,
} );

register( store );
unlock( store ).registerPrivateSelectors( privateSelectors );
unlock( store ).registerPrivateActions( privateActions );
