/**
 * WordPress dependencies
 */
import apiFetch from '@wordpress/api-fetch';
import { createReduxStore, registerStore } from '@wordpress/data';

/**
 * Internal dependencies
 */
import reducer from './reducer';
import * as resolvers from './resolvers';
import * as selectors from './selectors';
import * as actions from './actions';
import { STORE_NAME } from './constants';

/**
 * Block editor data store configuration.
 *
 * @see https://github.com/WordPress/gutenberg/blob/HEAD/packages/data/README.md#registerStore
 *
 * @type {Object}
 */
const storeConfig = {
	reducer,
	selectors,
	resolvers,
	actions,
};

/**
 * Store definition for the edit widgets namespace.
 *
 * @see https://github.com/WordPress/gutenberg/blob/HEAD/packages/data/README.md#createReduxStore
 *
 * @type {Object}
 */
export const store = createReduxStore( STORE_NAME, storeConfig );

// Once we build a more generic persistence plugin that works across types of stores
// we'd be able to replace this with a register call.
registerStore( STORE_NAME, storeConfig );

// This package uses a few in-memory post types as wrappers for convenience.
// This middleware prevents any network requests related to these types as they are
// bound to fail anyway.
apiFetch.use( function ( options, next ) {
	if ( options.path?.indexOf( '/wp/v2/types/widget-area' ) === 0 ) {
		return Promise.resolve( {} );
	}

	return next( options );
} );
