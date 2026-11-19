import { createReduxStore, register } from '@wordpress/data';
import reducer from './reducer';
import * as selectors from './selectors';
import * as actions from './actions';
import * as privateActions from './private-actions';
import * as privateSelectors from './private-selectors';
import * as privateResolvers from '../dataviews/store/private-resolvers';
import { STORE_NAME } from './constants';
import { unlock } from '../lock-unlock';

/**
 * Post editor data store configuration.
 *
 * @see https://github.com/WordPress/gutenberg/blob/HEAD/packages/data/README.md#registerStore
 */
export const storeConfig = {
	reducer,
	selectors,
	actions,
};

/**
 * Store definition for the editor namespace.
 *
 * @see https://github.com/WordPress/gutenberg/blob/HEAD/packages/data/README.md#createReduxStore
 */
export const store = createReduxStore( STORE_NAME, {
	...storeConfig,
	// The resolvers of private selectors, registered below.
	resolvers: privateResolvers,
} );

register( store );
unlock( store ).registerPrivateActions( privateActions );
unlock( store ).registerPrivateSelectors( privateSelectors );
