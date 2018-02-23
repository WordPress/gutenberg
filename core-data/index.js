/**
 * WordPress Dependencies
 */
import {
	registerReducer,
	registerSelectors,
} from '@wordpress/data';

/**
 * Internal dependencies
 */
import reducer from './reducer';
import { getCategories } from './selectors';

/**
 * Module Constants
 */
const MODULE_KEY = 'core';

const store = registerReducer( MODULE_KEY, reducer );
registerSelectors( MODULE_KEY, {
	getCategories: {
		select: getCategories,
		effect: () => {
			wp.apiRequest( { path: '/wp/v2/categories' } ).then( categories => {
				store.dispatch( {
					type: 'FETCH_CATEGORIES_SUCCESS',
					categories,
				} );
			} );
		},
	},
} );

export default store;
