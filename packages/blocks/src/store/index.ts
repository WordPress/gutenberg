/**
 * WordPress dependencies
 */
import { createReduxStore, register, select } from '@wordpress/data';
import type { WPDataAttachedStore } from '@wordpress/data/types.d';

/**
 * Internal dependencies
 */
import reducer from './reducer';
import * as selectors from './selectors';
import * as actions from './actions';
import { STORE_NAME } from './constants';

export type BlockStore = WPDataAttachedStore<
	typeof actions,
	typeof selectors
>;

/**
 * Store definition for the blocks namespace.
 *
 * @see https://github.com/WordPress/gutenberg/blob/HEAD/packages/data/README.md#createReduxStore
 */
export const store = createReduxStore( STORE_NAME, {
	reducer,
	selectors,
	actions,
} );

const a = store.instantiate( null as any );
a.getSelectors().getCategories( {} );
a.getActions().addBlockTypes( {} );

register( store );
select( store );
