/**
 * WordPress dependencies
 */
import { createReduxStore, register } from '@wordpress/data';

/**
 * Internal dependencies
 */
import reducer from './reducer';
import * as selectors from './selectors';
import * as actions from './actions';
import type { State } from '../types';

const STORE_NAME = 'core/rich-text';

/**
 * Store definition for the rich-text namespace.
 *
 * @see https://github.com/WordPress/gutenberg/blob/HEAD/packages/data/README.md#createReduxStore
 */
export const store = createReduxStore<
	State,
	typeof actions,
	typeof selectors
>( STORE_NAME, {
	reducer,
	selectors,
	actions,
} );

register( store );
