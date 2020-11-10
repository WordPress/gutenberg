/**
 * WordPress dependencies
 */
import { registerStore } from '@wordpress/data';

/**
 * Internal dependencies
 */
import reducer from './reducer';
import * as selectors from './selectors';
import * as actions from './actions';

/**
 * Module Constants
 */
const MODULE_KEY = 'core/annotations';

/**
 * Store registered for the annotations namespace.
 *
 * @see https://github.com/WordPress/gutenberg/blob/master/packages/data/README.md#registerStore
 *
 * @type {Object}
 */
export default registerStore( MODULE_KEY, {
	reducer,
	selectors,
	actions,
} );
