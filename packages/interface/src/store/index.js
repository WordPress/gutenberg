/**
 * WordPress dependencies
 */
import { createReduxStoreDefinition, register } from '@wordpress/data';

/**
 * Internal dependencies
 */
import reducer from './reducer';
import * as actions from './actions';
import * as selectors from './selectors';
import { STORE_NAME } from './constants';

/**
 * Store definition for the interface namespace.
 *
 * @see https://github.com/WordPress/gutenberg/blob/master/packages/data/README.md#createReduxStoreDefinition
 *
 * @type {Object}
 */
export const storeDefinition = createReduxStoreDefinition( STORE_NAME, {
	reducer,
	actions,
	selectors,
	persist: [ 'enableItems' ],
} );

register( storeDefinition );
