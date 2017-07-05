/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

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
	{ slug: 'embed', title: __( 'Embed' ) },
	{ slug: 'reusable-blocks', title: __( 'Saved Blocks' ) },
];

/**
 * Returns all the block categories.
 *
 * @returns {Array} Block categories.
 */
export function getCategories() {
	return categories;
}

/**
 * Register a new block category (e.g {slug: 'custom', title: __('Custom Blocks')})
 *
 * @return {Array} Block categories
 */
export function registerCategory( cat ) {

	if ( ! cat ) {
		console.error(
			'The Block category must be defined'
		);
		return;
	}

	if ( ! cat.slug ) {
		console.error(
			'The Block category slug must be defined'
		);
		return;
	}

	if ( ! /^[a-z0-9-]+$/.test( cat.slug ) ) {
		console.error(
			'Block category slug must not contain characters which are invalid for urls'
		);
		return;
	}

	if ( categories.find( x => x.slug === cat.slug ) ) {
		console.error(
			'Block category "' + cat.slug + '" is already registered.'
		);
		return;
	}

	if ( ! cat.title ) {
		console.error(
			'The Block category title must be defined'
		);
		return;
	}

	categories.push(cat);
	return categories;
}