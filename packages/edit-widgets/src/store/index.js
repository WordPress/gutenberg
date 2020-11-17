/**
 * WordPress dependencies
 */
import apiFetch from '@wordpress/api-fetch';
import { registerStore } from '@wordpress/data';

/**
 * Internal dependencies
 */
import reducer from './reducer';
import * as resolvers from './resolvers';
import * as selectors from './selectors';
import * as actions from './actions';
import controls from './controls';
import './batch-support';

/**
 * Module Constants
 */
const MODULE_KEY = 'core/edit-widgets';

/**
 * Block editor data store configuration.
 *
 * @see https://github.com/WordPress/gutenberg/blob/master/packages/data/README.md#registerStore
 *
 * @type {Object}
 */
export const storeConfig = {
	reducer,
	controls,
	selectors,
	resolvers,
	actions,
};

const store = registerStore( MODULE_KEY, storeConfig );

// This package uses a few in-memory post types as wrappers for convenience.
// This middleware prevents any network requests related to these types as they are
// bound to fail anyway.
apiFetch.use( function ( options, next ) {
	if ( options.path?.indexOf( '/wp/v2/types/widget-area' ) === 0 ) {
		return Promise.resolve( {} );
	}

	return next( options );
} );

export default store;
