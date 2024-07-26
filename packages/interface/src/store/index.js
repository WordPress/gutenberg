/**
 * WordPress dependencies
 */
import { createReduxStore, register } from '@wordpress/data';

/**
 * Internal dependencies
 */
import * as actions from './actions';
import * as privateActions from './private-actions';
import * as selectors from './selectors';
import * as privateSelectors from './private-selectors';
import reducer from './reducer';
import { STORE_NAME } from './constants';
import { unlock } from '../lock-unlock';

/**
 * Store definition for the interface namespace.
 *
 * @see https://github.com/WordPress/gutenberg/blob/HEAD/packages/data/README.md#createReduxStore
 *
 * @type {Object}
 */
export const store = createReduxStore( STORE_NAME, {
	reducer,
	actions,
	selectors,
} );

// Once we build a more generic persistence plugin that works across types of stores
// we'd be able to replace this with a register call.
register( store );
unlock( store ).registerPrivateActions( privateActions );
unlock( store ).registerPrivateSelectors( privateSelectors );
