/**
 * External dependencies
 */
// import { get } from 'lodash';

/**
 * WordPress dependencies
 */
import { select } from '@wordpress/data';

/**
 * Returns all the block categories.
 *
 * @return {Array} Block categories.
 */
export function getCategories() {
	// const customCategories = get( window, [ 'customGutenberg', 'categories' ] );
	// return customCategories || categories;

	return select( 'core/blocks' ).getCategories();
}
