/**
 * WordPress dependencies
 */
import { dispatch, select } from '@wordpress/data';
import { Dashicon } from '@wordpress/components';

/**
 * Internal dependencies
 */
import { store as blocksStore } from '../store';

export interface WPBlockCategory {
	slug: string;
	title: string;
	icon?: JSX.Element | Dashicon.Icon | null | undefined;
}

/**
 * Returns all the block categories.
 * Ignored from documentation as the recommended usage is via useSelect from @wordpress/data.
 *
 * @ignore
 *
 * @return {WPBlockCategory[]} Block categories.
 */
export function getCategories(): WPBlockCategory[] {
	return select( blocksStore ).getCategories();
}

/**
 * Sets the block categories.
 *
 * @param {WPBlockCategory[]} categories Block categories.
 *
 * @example
 * ```js
 * import { __ } from '@wordpress/i18n';
 * import { store as blocksStore, setCategories } from '@wordpress/blocks';
 * import { useSelect } from '@wordpress/data';
 * import { Button } from '@wordpress/components';
 *
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
export function setCategories( categories: readonly WPBlockCategory[] ): void {
	dispatch( blocksStore ).setCategories( categories );
}

/**
 * Updates a category.
 *
 * @param {string}          slug     Block category slug.
 * @param {WPBlockCategory} category Object containing the category properties
 *                                   that should be updated.
 *
 * @example
 * ```js
 * import { __ } from '@wordpress/i18n';
 * import { updateCategory } from '@wordpress/blocks';
 * import { Button } from '@wordpress/components';
 *
 * const ExampleComponent = () => {
 *     return (
 *         <Button
 *             onClick={ () => {
 *                 updateCategory( 'text', { title: __( 'Written Word' ) } );
 *             } }
 *         >
 *             { __( 'Update Text category title' ) }
 *         </Button>
 * )    ;
 * };
 * ```
 */
export function updateCategory(
	slug: string,
	category: Partial< WPBlockCategory >
): void {
	dispatch( blocksStore ).updateCategory( slug, category );
}
