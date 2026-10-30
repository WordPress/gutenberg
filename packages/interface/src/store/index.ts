import { createReduxStore, register } from '@wordpress/data';
import * as actions from './actions';
import * as selectors from './selectors';
import reducer from './reducer';
import { STORE_NAME } from './constants';
import type { StoreState } from './types';

/**
 * Store definition for the interface namespace.
 *
 * @see https://github.com/WordPress/gutenberg/blob/HEAD/packages/data/README.md#createReduxStore
 */
export const store = createReduxStore<
	StoreState,
	typeof actions,
	typeof selectors
>( STORE_NAME, {
	reducer,
	actions,
	selectors,
} );
register( store );
