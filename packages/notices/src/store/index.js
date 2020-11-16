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

const STORE_NAME = 'core/notices';

/**
 * Store definition for the notices namespace.
 *
 * @see https://github.com/WordPress/gutenberg/blob/master/packages/data/README.md#createReduxStoreDefinition
 *
 * @type {Object}
 */
export const storeDefinition = createReduxStoreDefinition( STORE_NAME, {
	reducer,
	actions,
	selectors,
} );

register( storeDefinition );
