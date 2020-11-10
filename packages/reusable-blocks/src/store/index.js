/**
 * WordPress dependencies
 */
import { registerStore } from '@wordpress/data';

/**
 * Internal dependencies
 */
import * as actions from './actions';
import controls from './controls';
import reducer from './reducer';
import * as selectors from './selectors';
import { STORE_KEY } from './constants';

/**
 * Store registered for the reusable blocks namespace.
 *
 * @see https://github.com/WordPress/gutenberg/blob/master/packages/data/README.md#registerStore
 *
 * @type {Object}
 */
export default registerStore( STORE_KEY, {
	actions,
	controls,
	reducer,
	selectors,
} );
