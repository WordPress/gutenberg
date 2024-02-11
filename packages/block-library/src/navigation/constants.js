export const DEFAULT_BLOCK = {
	name: 'core/navigation-link',
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

export const NAVIGATION_MOBILE_COLLAPSE = '600px';
