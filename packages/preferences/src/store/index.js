/**
 * WordPress dependencies
 */
import { createReduxStore, registerStore } from '@wordpress/data';

/**
 * Internal dependencies
 */
/**
 * Internal dependencies
 */
import reducer from './reducer';
import * as actions from './actions';
import * as selectors from './selectors';
import { STORE_NAME } from './constants';

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
	persist: [ 'features' ],
	__experimentalUseThunks: true,
} );

// Once we build a more generic persistence plugin that works across types of stores
// we'd be able to replace this with a register call.
registerStore( STORE_NAME, {
	reducer,
	actions,
	selectors,
	persist: [ 'features' ],
	__experimentalUseThunks: true,
} );
