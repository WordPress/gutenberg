// URL path segments for the top-level tabs / list pages.
export const POST_TYPES_PATH = '/post-types';
export const TAXONOMIES_PATH = '/taxonomies';

// Core-data postType names that store the user-defined records.
export const POST_TYPE_ENTITY = 'wp_user_post_type';
export const TAXONOMY_ENTITY = 'wp_user_taxonomy';

// Sentinel for the edit-route param when creating a new record.
export const NEW_ID = 'new';

// Slugs that WordPress uses as public/private query vars. Registering a
// taxonomy or post type with one of these names creates rewrite rules that
// collide with built-in URLs (e.g. `?cat=`, `?author=`, `?name=`) and
// silently routes archives to the wrong handler. The PHP REST controller
// consults `$wp->public_query_vars` as the authoritative source; this list
// mirrors the high-risk subset for inline form validation.
export const RESERVED_KEYS = new Set( [
	'attachment',
	'attachment_id',
	'author',
	'author_name',
	'cat',
	'category_name',
	'cpage',
	'day',
	'feed',
	'm',
	'monthnum',
	'name',
	'p',
	'page',
	'page_id',
	'pagename',
	'paged',
	'post_type',
	'posts',
	's',
	'search',
	'tag',
	'tag_id',
	'taxonomy',
	'term',
	'title',
	'year',
] );
