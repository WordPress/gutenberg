import { cleanForSlug } from '@wordpress/url';

/**
 * The part of a Navigation Menu record a reference resolves against.
 *
 * A record may come from the editor's Navigation Menus collection or from a
 * query for a slug, so only these two fields are relied on here.
 */
type NavigationMenuReferenceFields = {
	slug?: string;
	status?: string;
};

/**
 * Normalizes a Navigation Menu slug.
 *
 * Slugs may be authored by hand in templates and patterns, so they are
 * normalized before comparison to match the slug WordPress stores on the
 * `wp_navigation` post.
 *
 * `cleanForSlug()` only approximates `sanitize_title()`: it works on decoded
 * characters, while WordPress percent encodes the ones it cannot fold to
 * ASCII, so `{"slug":"你好"}` normalizes here to `你好` but is stored as
 * `%e4%bd%a0%e5%a5%bd`. Resolution therefore falls back to asking the server
 * for the slug, see `useNavigationMenu()`.
 *
 * @param slug The raw slug, as it may have been authored by hand.
 *
 * @return The normalized slug, or an empty string.
 */
export function normalizeNavigationMenuSlug( slug?: unknown ): string {
	return slug ? cleanForSlug( String( slug ) ) : '';
}

/**
 * Picks the Navigation Menu a reference resolves to among the matching ones.
 *
 * Published menus take precedence over drafts so that the editor resolves the
 * same menu the front end renders. See `index.php`, which only resolves
 * published menus.
 *
 * @param navigationMenus  The available Navigation Menu records.
 * @param matchesReference Whether a record matches the reference.
 *
 * @return The resolved Navigation Menu, if there is one.
 */
function findResolvedNavigationMenu< T extends NavigationMenuReferenceFields >(
	navigationMenus: T[] | null | undefined,
	matchesReference: ( menu: T ) => boolean
): T | undefined {
	return (
		navigationMenus?.find(
			( menu ) => matchesReference( menu ) && menu.status === 'publish'
		) ?? navigationMenus?.find( matchesReference )
	);
}

/**
 * Picks the Navigation Menu a slug query resolves to.
 *
 * The server matched the slug exactly, so only the status decides here.
 *
 * @param navigationMenus The Navigation Menus the server matched.
 *
 * @return The resolved Navigation Menu, if there is one.
 */
export function getQueriedNavigationMenu<
	T extends NavigationMenuReferenceFields,
>( navigationMenus: T[] | null | undefined ): T | undefined {
	return findResolvedNavigationMenu( navigationMenus, () => true );
}

/**
 * Finds the Navigation Menu that a slug reference resolves to.
 *
 * @param navigationMenus The available Navigation Menu records.
 * @param slug            The slug to resolve.
 *
 * @return The matching Navigation Menu, if there is one.
 */
export default function getNavigationMenuBySlug<
	T extends NavigationMenuReferenceFields,
>( navigationMenus: T[] | null | undefined, slug?: unknown ): T | undefined {
	const normalizedSlug = normalizeNavigationMenuSlug( slug );

	if ( ! normalizedSlug || ! navigationMenus?.length ) {
		return undefined;
	}

	return findResolvedNavigationMenu(
		navigationMenus,
		( menu ) => normalizeNavigationMenuSlug( menu.slug ) === normalizedSlug
	);
}
