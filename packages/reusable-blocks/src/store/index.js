/**
 * WordPress dependencies
 */
import { registerStore } from '@wordpress/data';

/**
 * Internal dependencies
 */
import controls from './controls';
import * as actions from './actions';
import { STORE_KEY } from './constants';

/**
 * Data store configuration.
 *
 * @see https://github.com/WordPress/gutenberg/blob/master/packages/data/README.md#registerStore
 *
 * @type {Object}
 */
export default registerStore( STORE_KEY, {
	actions,
	controls,
	reducer: () => {},
} );
