// URL path segments for the top-level tabs / list pages.
export const POST_TYPES_PATH = '/post-types';
export const TAXONOMIES_PATH = '/taxonomies';

// Core-data postType names that store the user-defined records.
export const POST_TYPE_ENTITY = 'wp_user_post_type';
export const TAXONOMY_ENTITY = 'wp_user_taxonomy';

// Sentinel for the edit-route param when creating a new record.
export const NEW_ID = 'new';

// Reserved post type slugs per `register_post_type()` docs.
// @see https://developer.wordpress.org/reference/functions/register_post_type/#reserved-post-types.
// The PHP REST controller is authoritative (it also consults
// `$wp->public_query_vars` for rewrite-collision safety); this list drives
// inline form validation.
export const RESERVED_POST_TYPE_KEYS = new Set( [
	'post',
	'page',
	'attachment',
	'revision',
	'nav_menu_item',
	'custom_css',
	'customize_changeset',
	'oembed_cache',
	'user_request',
	'wp_block',
	'wp_global_styles',
	'wp_navigation',
	'wp_template',
	'wp_template_part',
	'action',
	'author',
	'order',
	'theme',
] );

// Reserved taxonomy slugs per `register_taxonomy()` docs.
// @see https://developer.wordpress.org/reference/functions/register_taxonomy/#reserved-terms.
// The PHP REST controller is authoritative (it also consults
// `$wp->public_query_vars` for rewrite-collision safety); this list drives
// inline form validation.
export const RESERVED_TAXONOMY_KEYS = new Set( [
	'attachment',
	'attachment_id',
	'author',
	'author_name',
	'calendar',
	'cat',
	'category',
	'category__and',
	'category__in',
	'category__not_in',
	'category_name',
	'comments_per_page',
	'comments_popup',
	'custom',
	'customize_messenger_channel',
	'customized',
	'cpage',
	'day',
	'debug',
	'embed',
	'error',
	'exact',
	'feed',
	'fields',
	'hour',
	'link_category',
	'm',
	'minute',
	'monthnum',
	'more',
	'name',
	'nav_menu',
	'nonce',
	'nopaging',
	'offset',
	'order',
	'orderby',
	'p',
	'page',
	'page_id',
	'paged',
	'pagename',
	'pb',
	'perm',
	'post',
	'post__in',
	'post__not_in',
	'post_format',
	'post_mime_type',
	'post_status',
	'post_tag',
	'post_type',
	'posts',
	'posts_per_archive_page',
	'posts_per_page',
	'preview',
	'robots',
	's',
	'search',
	'second',
	'sentence',
	'showposts',
	'static',
	'status',
	'subpost',
	'subpost_id',
	'tag',
	'tag__and',
	'tag__in',
	'tag__not_in',
	'tag_id',
	'tag_slug__and',
	'tag_slug__in',
	'taxonomy',
	'tb',
	'term',
	'terms',
	'theme',
	'title',
	'type',
	'types',
	'w',
	'withcomments',
	'withoutcomments',
	'year',
] );
