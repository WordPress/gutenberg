/**
 * WordPress dependencies
 */
import { createStoreDefinition, registerStore } from '@wordpress/data';

/**
 * Internal dependencies
 */
import reducer from './reducer';
import * as selectors from './selectors';
import * as actions from './actions';

/**
 * Module Constants
 */
const STORE_NAME = 'core/annotations';

/**
 * Store definition for the annotations namespace.
 *
 * @see https://github.com/WordPress/gutenberg/blob/master/packages/data/README.md#createStoreDefinition
 *
 * @type {Object}
 */
export const storeDefinition = createStoreDefinition( STORE_NAME );

export default registerStore( STORE_NAME, {
	reducer,
	selectors,
	actions,
} );
