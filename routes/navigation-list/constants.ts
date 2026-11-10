export const NAVIGATION_POST_TYPE = 'wp_navigation';

// These parameters must be kept aligned with those in
// packages/block-library/src/navigation/constants.js
// and
// lib/compat/wordpress-6.3/navigation-block-preloading.php
export const PRELOADED_NAVIGATION_MENUS_QUERY = {
	per_page: 100,
	status: [ 'publish', 'draft' ],
	order: 'desc',
	orderby: 'date',
};
