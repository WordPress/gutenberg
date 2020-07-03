/**
 * WordPress dependencies
 */
import { dispatch, select } from '@wordpress/data';

/** @typedef {import('../store/reducer').WPBlockCategory} WPBlockCategory */

/**
 * Returns all the block categories.
 *
 * @return {WPBlockCategory[]} Block categories.
 */
export function getCategories() {
	return select( 'core/blocks' ).getCategories();
}

/**
 * Sets the block categories.
 *
 * @param {WPBlockCategory[]} categories Block categories.
 */
export function setCategories( categories ) {
	dispatch( 'core/blocks' ).setCategories( categories );
}

/**
 * Updates a category.
 *
 * @param {string}          slug     Block category slug.
 * @param {WPBlockCategory} category Object containing the category properties
 *                                   that should be updated.
 */
export function updateCategory( slug, category ) {
	dispatch( 'core/blocks' ).updateCategory( slug, category );
}

/**
 * Accepts an array of category names and returns the first one that
 * exists in the categories returned by `getCategories`. This allows
 * for a "graceful degradation" strategy to category names, where
 * we just add the new category name as the first item in the array
 * argument, and leave the old ones for environments where they still
 * exist and are used.
 *
 * @example
 * // Prefer passing the new category first in the array, followed by
 * // older fallback categories. Considering the 'new' category is
 * // registered:
 * getCategoryWithFallbacks( 'new', 'old', 'older' );
 * // => 'new'
 *
 * @param {string[]} requestedCategories - an array of categories.
 * @return {string} the first category name found.
 * @throws {Error} if the no categories could be found.
 */
export function getCategoryWithFallbacks( ...requestedCategories ) {
	const knownCategories = getCategories();
	for ( const requestedCategory of requestedCategories ) {
		if (
			knownCategories.some( ( { slug } ) => slug === requestedCategory )
		) {
			return requestedCategory;
		}
	}
	throw new Error(
		`Could not find a category from the provided list: ${ requestedCategories.join(
			','
		) }`
	);
}
