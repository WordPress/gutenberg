/**
 * WordPress dependencies
 */
import { registerStore } from '@wordpress/data';

/**
 * Internal dependencies
 */
import * as actions from './actions';
import reducer from './reducer';
import controls from './controls';
import * as selectors from './selectors';
import { MODULE_KEY } from './constants';

/**
 * Block editor data store configuration.
 *
 * @see https://github.com/WordPress/gutenberg/blob/master/packages/data/README.md#registerStore
 *
 * @type {Object}
 */
export const storeConfig = {
	actions,
	reducer,
	controls,
	selectors,
};

const store = registerStore( MODULE_KEY, storeConfig );

export default store;
