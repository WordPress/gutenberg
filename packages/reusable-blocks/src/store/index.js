/**
 * WordPress dependencies
 */
import { createReduxStore, register } from '@wordpress/data';

/**
 * Internal dependencies
 */
import * as actions from './actions';
import reducer from './reducer';
import * as selectors from './selectors';

const STORE_NAME = 'core/reusable-blocks';

/**
 * Store definition for the reusable blocks namespace.
 *
 * @see https://github.com/WordPress/gutenberg/blob/HEAD/packages/data/README.md#createReduxStore
 *
 * @type {Object}
 */
export const store = createReduxStore( STORE_NAME, {
	actions,
	reducer,
	selectors,
	__experimentalUseThunks: true,
} );

register( store );
