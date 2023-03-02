/**
 * Block Category Interface
 *
 * @module BlockCategory
 */

/**
 * Internal dependencies
 */
import type { BlockType } from './block-type';
import type { BlockIconRenderer } from './block-icon';

/**
 * Custom category of {@link BlockType}.
 *
 * Note, similar in concept but differs from {@link BlockType.category} which are core categories.
 *
 * @public
 */
export interface BlockCategory {
	/**
	 * Unique category slug.
	 */
	slug: string;

	/**
	 * Category label, for display in user interface.
	 */
	title: string;

	/**
	 * Optional icon, for display in user interface.
	 */
	icon?: BlockIconRenderer;
}
