/**
 * WordPress dependencies
 */
import { dispatch, select } from '@wordpress/data';

/**
 * @typedef {import('@wordpress/blocks').Category} Category
 */

/**
 * Returns all the block categories.
 *
 * @return {Category[]} Block categories.
 */
export function getCategories() {
	return select( 'core/blocks' ).getCategories();
}

/**
 * Sets the block categories.
 *
 * @param {Category[]} categories Block categories.
 */
export function setCategories( categories ) {
	dispatch( 'core/blocks' ).setCategories( categories );
}

/**
 * Updates a category.
 *
 * @param {string}            slug     Block category slug.
 * @param {Partial<Category>} category Object containing the category properties that should be updated.
 */
export function updateCategory( slug, category ) {
	dispatch( 'core/blocks' ).updateCategory( slug, category );
}
