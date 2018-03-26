/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * Block categories are defined groups for organizing blocks.
 *
 * @var {Array} categories
 */
const categories = [
	{ slug: 'common', title: __( 'Common Blocks' ) },
	{ slug: 'formatting', title: __( 'Formatting' ) },
	{ slug: 'layout', title: __( 'Layout Elements' ) },
	{ slug: 'widgets', title: __( 'Widgets' ) },
	{ slug: 'embed', title: __( 'Embeds' ) },
	{ slug: 'shared', title: __( 'Shared Blocks' ) },
];

/**
 * Returns all the block categories.
 *
 * @return {Array} Block categories.
 */
export function getCategories() {
	if ( typeof window.customGutenberg === 'object' && window.customGutenberg.categories ) {
		return window.customGutenberg.categories;
	}

	return categories;
}
