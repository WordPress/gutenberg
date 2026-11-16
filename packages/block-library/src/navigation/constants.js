export const DEFAULT_BLOCK = {
	name: 'core/navigation-link',
	attributes: {
		kind: 'post-type',
		type: 'page',
	},
};

export const PRIORITIZED_INSERTER_BLOCKS = [
	'core/navigation-link/page',
	'core/navigation-link/custom-link',
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

/**
 * Asks the server for the Navigation Menus holding an exact slug.
 *
 * `PRELOADED_NAVIGATION_MENUS_QUERY` is capped at 100 menus and is matched
 * against client side, so it cannot resolve every slug. This query is only
 * made when that collection does not match, see `useNavigationMenu()`.
 *
 * The server sanitizes the `slug` parameter, so it matches the menu the front
 * end renders. The page size only has to cover the menus of a site that
 * already had duplicate slugs, since slugs are unique from now on.
 */
const NAVIGATION_MENUS_BY_SLUG_QUERY = {
	per_page: 10,
	status: [ 'publish', 'draft' ],
	order: 'desc',
	orderby: 'date',
};

/**
 * Builds the `getEntityRecords` arguments for the Navigation Menus holding a
 * slug, so that the query is made and invalidated with the same arguments.
 *
 * @param {string} [slug] The slug to ask the server for.
 *
 * @return {Array} The `getEntityRecords` arguments.
 */
export const getNavigationMenusBySlugArgs = ( slug ) => [
	'postType',
	'wp_navigation',
	{ ...NAVIGATION_MENUS_BY_SLUG_QUERY, slug: slug ? [ slug ] : [] },
];

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
