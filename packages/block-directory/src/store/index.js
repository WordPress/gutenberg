/**
 * WordPress dependencies
 */
import { registerStore } from '@wordpress/data';
import { controls as dataControls } from '@wordpress/data-controls';

/**
 * Internal dependencies
 */
import reducer from './reducer';
import * as selectors from './selectors';
import * as actions from './actions';
import resolvers from './resolvers';
import controls from './controls';

/**
 * Module Constants
 */
const MODULE_KEY = 'core/block-directory';

/**
 * Block editor data store configuration.
 *
 * @see https://github.com/WordPress/gutenberg/blob/master/packages/data/README.md#registerStore
 *
 * @type {Object}
 */
export const storeConfig = {
	reducer,
	selectors,
	actions,
	controls: { ...dataControls, ...controls },
	resolvers,
};

const store = registerStore( MODULE_KEY, storeConfig );

export default store;
