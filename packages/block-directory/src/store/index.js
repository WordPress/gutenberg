/**
 * WordPress dependencies
 */
import { createReduxStoreDefinition, register } from '@wordpress/data';
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
const STORE_NAME = 'core/block-directory';

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

/**
 * Store definition for the block directory namespace.
 *
 * @see https://github.com/WordPress/gutenberg/blob/master/packages/data/README.md#createReduxStoreDefinition
 *
 * @type {Object}
 */
export const storeDefinition = createReduxStoreDefinition(
	STORE_NAME,
	storeConfig
);

register( storeDefinition );
