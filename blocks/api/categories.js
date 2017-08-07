/* eslint no-console: [ 'error', { allow: [ 'error' ] } ] */

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { sortBy, findIndex } from 'lodash';

/**
 * Block categories.
 *
 * Group blocks together based on common traits
 * The block "inserter" relies on these to present the list blocks
 *
 * @var {Array} categories
 */
let categories = [
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
 * Register a new block category
 *
 * @param {Array} cat e.g {slug: 'custom', title: __('Custom Blocks')}
 *
 * @return {Array} Block categories
 *
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
			'Block category "' + cat.slug + '" is already registered'
		);
		return;
	}
	if ( ! cat.title ) {
		console.error(
			'The Block category title must be defined'
		);
		return;
	}

	categories.push( cat );
	return categories;
}

/**
 *
 * Sort categories by key
 *
 * @param {String} key The key to sort by
 *
 * @returns {Array} Block categories
 */
export function sortCategoriesBy( key ) {
	if ( ! key ) {
		console.error(
			'The key must be defined'
		);
		return;
	}
	if ( typeof key !== 'string' ) {
		console.error(
			'The key must be a string'
		);
		return;
	}
	categories = sortBy( categories, key );
	return categories;
}

/**
 * Set the property 'order' for a category
 *
 * @param {String}    slug    The slug for the category
 * @param {Number}    order   The order for the category
 *
 * @returns {Array} Block categories
 */
export function setCategoryOrder( slug, order ) {
	const pos = findIndex( categories, ( category ) => category.slug === slug );
	if ( ! slug ) {
		console.error(
			'The slug must be defined'
		);
		return;
	}
	if ( typeof slug !== 'string' ) {
		console.error(
			'The slug must be a string'
		);
		return;
	}
	if ( ! ( order === parseInt( order, 10 ) ) ) {
		console.error(
			'The order must be an integer'
		);
		return;
	}
	categories[ pos ].order = order;
	return categories;
}
