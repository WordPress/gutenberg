/**
 * WordPress dependencies
 */
import apiFetch from '@wordpress/api-fetch';
import { createReduxStore, register } from '@wordpress/data';

/**
 * Internal dependencies
 */
import reducer from './reducer';
import * as resolvers from './resolvers';
import * as selectors from './selectors';
import * as actions from './actions';
import * as privateSelectors from './private-selectors';
import { STORE_NAME } from './constants';
import { unlock } from '../lock-unlock';

/**
 * Block editor data store configuration.
 *
 * @see https://github.com/WordPress/gutenberg/blob/HEAD/packages/data/README.md#register
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
register( store );

// This package uses a few in-memory post types as wrappers for convenience.
// This middleware prevents any network requests related to these types as they are
// bound to fail anyway.
apiFetch.use( function ( options, next ) {
	if ( options.path?.indexOf( '/wp/v2/types/widget-area' ) === 0 ) {
		return Promise.resolve( {} );
	}

	return next( options );
} );

unlock( store ).registerPrivateSelectors( privateSelectors );
