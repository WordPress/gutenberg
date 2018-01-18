/* eslint no-console: [ 'error', { allow: [ 'error' ] } ] */

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
 * @type {RegExp}
 * @const
 *
 * Category names must be a combination of lower-case letters, numbers, and hypens
 */
const categoryNamePattern = /^[a-z0-9-]+$/;

/**
 * Returns all the block categories.
 *
 * @returns {Array} Block categories.
 */
export function getCategories() {
	return categories;
}

/**
 * Register a new block Category.
 *
 * @param {Array} category e.g {slug: 'custom', title: __('Custom Blocks')}
 *
 * @return {Array} categories
 */
export function registerCategory( category ) {
	if ( ! category ) {
		console.error(
			'The block Category must be defined'
		);
		return;
	}
	if ( ! category.slug ) {
		console.error(
			'The block Category slug must be defined'
		);
		return;
	}
	if ( ! categoryNamePattern.test( category.slug ) ) {
		console.error(
			'The block Category slug must not contain characters which are invalid for urls'
		);
		return;
	}

	if ( categories.some( x => x.slug === category.slug ) ) {
		console.error(
			'The block Category "' + category.slug + '" is already registered'
		);
		return;
	}
	if ( ! category.title ) {
		console.error(
			'The block Category title must be defined'
		);
		return;
	}

	categories.push( category );
	return categories;
}

