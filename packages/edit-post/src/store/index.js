import { createReduxStore, register } from '@wordpress/data';
import reducer from './reducer';
import * as actions from './actions';
import * as privateActions from './private-actions';
import * as selectors from './selectors';
import { STORE_NAME } from './constants';
import { unlock } from '../lock-unlock';

/**
 * Store definition for the edit post namespace.
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
register( store );
unlock( store ).registerPrivateActions( privateActions );
