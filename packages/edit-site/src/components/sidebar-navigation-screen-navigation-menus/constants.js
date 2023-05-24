// This requested is preloaded in `gutenberg_preload_navigation_posts`.
// As unbounded queries are limited to 100 by `fetchAllMiddleware`
// on apiFetch this query is limited to 100.
export const PRELOADED_NAVIGATION_MENUS_QUERY = {
	per_page: 100,
	status: 'publish',
	order: 'desc',
	orderby: 'date',
};
