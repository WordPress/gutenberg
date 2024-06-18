/**
 * WordPress dependencies
 */
import { createReduxStore, registerStore } from '@wordpress/data';

/**
 * Internal dependencies
 */
import reducer from './reducer';
import * as actions from './actions';
import * as selectors from './selectors';

const STORE_NAME = 'core/nux';

/**
 * Store definition for the nux namespace.
 *
 * @see https://github.com/WordPress/gutenberg/blob/HEAD/packages/data/README.md#createReduxStore
 *
 * @type {Object}
 */
export const store = createReduxStore( STORE_NAME, {
	reducer,
	actions,
	selectors,
	persist: [ 'preferences' ],
} );

// Once we build a more generic persistence plugin that works across types of stores
// we'd be able to replace this with a register call.
registerStore( STORE_NAME, {
	reducer,
	actions,
	selectors,
	persist: [ 'preferences' ],
} );
