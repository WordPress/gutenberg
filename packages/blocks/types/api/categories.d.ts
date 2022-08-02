import { Dashicon } from '@wordpress/components';

export interface WPBlockCategory {
	slug: string;
	title: string;
	icon?: JSX.Element | Dashicon.Icon | null | undefined;
}
/**
 * Returns all the block categories.
 */
export function getCategories(): WPBlockCategory[];

/**
 * Sets the block categories.
 */
export function setCategories( categories: readonly WPBlockCategory[] ): void;

/**
 * Updates a category.
 */
export function updateCategory(
	slug: string,
	category: Partial< WPBlockCategory >
): void;
