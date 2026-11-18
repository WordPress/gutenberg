import { createReduxStore, register } from '@wordpress/data';
import type { ReduxStoreConfig } from '@wordpress/data';
import reducer from './reducer';
import * as actions from './actions';
import { STORE_NAME } from './constants';
import * as selectors from './selectors';
import { unlock } from '../lock-unlock';
import type { State } from './types';

/**
 * Post editor data store configuration.
 *
 * @see https://github.com/WordPress/gutenberg/blob/HEAD/packages/data/README.md#registerStore
 */
export const storeConfig: Pick<
	ReduxStoreConfig< State, unknown, unknown >,
	'reducer'
> = {
	reducer,
};

/**
 * Store definition for the editor namespace.
 *
 * @see https://github.com/WordPress/gutenberg/blob/HEAD/packages/data/README.md#createReduxStore
 */
export const store = createReduxStore( STORE_NAME, {
	...storeConfig,
} );

register( store );
unlock( store ).registerPrivateActions( actions );
unlock( store ).registerPrivateSelectors( selectors );
