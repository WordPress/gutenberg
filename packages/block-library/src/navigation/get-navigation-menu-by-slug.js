import { cleanForSlug } from '@wordpress/url';

/**
 * Normalizes a Navigation Menu slug.
 *
 * Slugs may be authored by hand in templates and patterns, so they are
 * normalized before comparison to match the slug WordPress stores on the
 * `wp_navigation` post. This mirrors `sanitize_title()` on the server.
 *
 * @param {string} [slug] The raw slug.
 *
 * @return {string} The normalized slug, or an empty string.
 */
export function normalizeNavigationMenuSlug( slug ) {
	return slug ? cleanForSlug( String( slug ) ) : '';
}

/**
 * Finds the Navigation Menu that a slug reference resolves to.
 *
 * Published menus take precedence over drafts so that the editor resolves the
 * same menu the front end renders. See `index.php`, which only resolves
 * published menus.
 *
 * @param {Object[]} [navigationMenus] The available Navigation Menu records.
 * @param {string}   [slug]            The slug to resolve.
 *
 * @return {Object|undefined} The matching Navigation Menu, if there is one.
 */
export default function getNavigationMenuBySlug( navigationMenus, slug ) {
	const normalizedSlug = normalizeNavigationMenuSlug( slug );

	if ( ! normalizedSlug || ! navigationMenus?.length ) {
		return undefined;
	}

	const hasSlug = ( menu ) =>
		normalizeNavigationMenuSlug( menu?.slug ) === normalizedSlug;

	return (
		navigationMenus.find(
			( menu ) => hasSlug( menu ) && menu.status === 'publish'
		) ?? navigationMenus.find( hasSlug )
	);
}
