export const DEFAULT_BLOCK = {
	name: 'core/navigation-link',
	attributes: {
		kind: 'post-type',
		type: 'page',
	},
};

export const PRIORITIZED_INSERTER_BLOCKS = [
	'core/navigation-link/page',
	'core/navigation-link',
];

// These parameters must be kept aligned with those in
// lib/compat/wordpress-6.3/navigation-block-preloading.php
// and
// edit-site/src/components/sidebar-navigation-screen-navigation-menus/constants.js
export const PRELOADED_NAVIGATION_MENUS_QUERY = {
	per_page: 100,
	status: [ 'publish', 'draft' ],
	order: 'desc',
	orderby: 'date',
};

export const SELECT_NAVIGATION_MENUS_ARGS = [
	'postType',
	'wp_navigation',
	PRELOADED_NAVIGATION_MENUS_QUERY,
];

/**
 * Template part area identifier for navigation overlays.
 * This constant defines the area name used when registering and filtering
 * template parts that are specifically designed for navigation overlay layouts.
 *
 * @type {string}
 */
export const NAVIGATION_OVERLAY_TEMPLATE_PART_AREA = 'navigation-overlay';
