/**
 * WordPress Dependencies
 */
import { registerStore } from '@wordpress/data';

/**
 * Internal dependencies
 */
import reducer from './reducer';
import { getCategories } from './selectors';

/**
 * Module Constants
 */
const MODULE_KEY = 'core';

const store = registerStore( MODULE_KEY, {
	reducer,
	selectors: { getCategories },
	resolvers: {
		getCategories: {
			fulfill() {
				wp.apiRequest( { path: '/wp/v2/categories' } ).then( categories => {
					store.dispatch( {
						type: 'RECEIVE_CATEGORIES',
						categories,
					} );
				} );
			},
		},
	},
} );

export default store;
