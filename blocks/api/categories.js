/**
 * WordPress dependencies
 */
import { __ } from 'i18n';

/**
 * Block categories.
 *
 * Group blocks together based on common traits
 * The block "inserter" relies on these to present the list blocks
 *
 * @var {Array} categories
 */
const categories = [
	{ slug: 'common', title: __( 'Common Blocks' ) },
	{ slug: 'formatting', title: __( 'Formatting' ) },
	{ slug: 'layout', title: __( 'Layout Blocks' ) },
	{ slug: 'widgets', title: __( 'Widgets' ) },
	{ slug: 'embed-common', title: __( 'Common' ) },
	{ slug: 'embed-audio', title: __( 'Audio' ) },
	{ slug: 'embed-video', title: __( 'Video' ) },
	{ slug: 'embed-social', title: __( 'Social Media' ) },
	{ slug: 'embed-image', title: __( 'Images' ) },
	{ slug: 'embed-docs', title: __( 'Blogs and Documents' ) },
];

/**
 * Returns all the block categories
 *
 * @return {Array} Block categories
 */
export function getCategories() {
	return categories;
}
