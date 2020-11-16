/**
 * WordPress dependencies
 */
import { register, createReduxStoreDefinition } from '@wordpress/data';

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
 * @see https://github.com/WordPress/gutenberg/blob/master/packages/data/README.md#createReduxStoreDefinition
 *
 * @type {Object}
 */
export const storeDefinition = createReduxStoreDefinition( STORE_NAME, {
	reducer,
	selectors,
	actions,
} );

register( storeDefinition );
