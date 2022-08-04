/**
 * WordPress dependencies
 */
import { dispatch, select } from '@wordpress/data';

/**
 * Internal dependencies
 */
import { store as blocksStore } from '../store';

/** @typedef {import('../store/reducer').WPBlockCategory} WPBlockCategory */

/**
 * Returns all the block categories.
 *
 * @return {WPBlockCategory[]} Block categories.
 */
export function getCategories() {
	return select( blocksStore ).getCategories();
}

/**
 * Sets the block categories.
 *
 * @param {WPBlockCategory[]} categories Block categories.
 *
 * @example
 * ```js
 * const ExampleComponent = () => {
 *     // Retrieve the list of current categories.
 *     const blockCategories = useSelect(
 *         ( select ) => select( blocksStore ).getCategories(),
 *         []
 *     );
 *
 *     return (
 *         <Button
 *             onClick={ () => {
 *                 // Add a custom category to the existing list.
 *                 setCategories( [
 *                     ...blockCategories,
 *                     { title: 'Custom Category', slug: 'custom-category' },
 *                 ] );
 *             } }
 *         >
 *             { __( 'Add a new custom block category' ) }
 *         </Button>
 *     );
 * };
 * ```
 */
export function setCategories( categories ) {
	dispatch( blocksStore ).setCategories( categories );
}

/**
 * Updates a category.
 *
 * @param {string}          slug     Block category slug.
 * @param {WPBlockCategory} category Object containing the category properties
 *                                   that should be updated.
 */
export function updateCategory( slug, category ) {
	dispatch( blocksStore ).updateCategory( slug, category );
}
