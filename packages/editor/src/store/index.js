/**
 * WordPress dependencies
 */
import { createReduxStore, registerStore } from '@wordpress/data';
import { controls as dataControls } from '@wordpress/data-controls';

/**
 * Internal dependencies
 */
import reducer from './reducer';
import * as selectors from './selectors';
import * as actions from './actions';
import controls from './controls';
import { STORE_NAME } from './constants';

/**
 * Post editor data store configuration.
 *
 * @see https://github.com/WordPress/gutenberg/blob/HEAD/packages/data/README.md#registerStore
 *
 * @type {Object}
 */
export const storeConfig = {
	reducer,
	selectors,
	actions,
	controls: {
		...dataControls,
		...controls,
	},
};

/**
 * Store definition for the editor namespace.
 *
 * @see https://github.com/WordPress/gutenberg/blob/HEAD/packages/data/README.md#createReduxStore
 *
 * @type {Object}
 */
export const store = createReduxStore( STORE_NAME, {
	...storeConfig,
	persist: [ 'preferences' ],
} );

// Once we build a more generic persistence plugin that works across types of stores
// we'd be able to replace this with a register call.
registerStore( STORE_NAME, {
	...storeConfig,
	persist: [ 'preferences' ],
} );
