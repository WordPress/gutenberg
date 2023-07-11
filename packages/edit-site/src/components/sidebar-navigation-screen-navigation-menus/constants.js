// This requested is preloaded in `gutenberg_preload_navigation_posts`.
// As unbounded queries are limited to 100 by `fetchAllMiddleware`
// on apiFetch this query is limited to 100.
// These parameters must be kept aligned with those in
// lib/compat/wordpress-6.3/navigation-block-preloading.php
export const PRELOADED_NAVIGATION_MENUS_QUERY = {
	per_page: 100,
	status: [ 'publish', 'draft' ],
	order: 'desc',
	orderby: 'date',
};
