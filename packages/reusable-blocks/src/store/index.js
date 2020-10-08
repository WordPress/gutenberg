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
export const storeConfig = {
	actions,
	controls,
	reducer: () => {},
};

export default registerStore( STORE_KEY, storeConfig );
