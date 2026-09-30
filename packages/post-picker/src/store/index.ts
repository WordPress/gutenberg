import { createReduxStore, register } from '@wordpress/data';
import reducer from './reducer';
import * as actions from './actions';
import * as selectors from './selectors';
import { STORE_NAME } from './constants';

/**
 * Store definition for the post picker.
 *
 * @see https://github.com/WordPress/gutenberg/blob/HEAD/packages/data/README.md#createReduxStore
 */
export const store = createReduxStore( STORE_NAME, {
	reducer,
	actions,
	selectors,
} );

register( store );
