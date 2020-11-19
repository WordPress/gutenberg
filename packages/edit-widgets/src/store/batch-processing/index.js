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
import { STORE_NAME } from './constants';

/**
 * Block editor data store configuration.
 *
 * @see https://github.com/WordPress/gutenberg/blob/master/packages/data/README.md#registerStore
 *
 * @type {Object}
 */
const storeConfig = {
	actions,
	reducer,
	controls,
	selectors,
};

const store = registerStore( STORE_NAME, storeConfig );

export default store;
