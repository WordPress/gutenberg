import { normalizeNavigationMenuSlug } from '../get-navigation-menu-by-slug';

/**
 * The part of a Navigation Menu record a reference is built from.
 *
 * A menu may come from the Navigation Menus collection, from a newly created
 * record, or from the Navigation fallback, which is known by post ID alone.
 */
type SelectedNavigationMenu = {
	id?: number;
	slug?: string;
};

type NavigationMenuReference = {
	ref?: number;
	slug?: string;
};

/**
 * Works out how a Navigation block should reference a Navigation Menu.
 *
 * A block that already references its menu by slug keeps doing so, so that
 * switching menus does not silently downgrade a portable reference to a site
 * specific post ID.
 *
 * @param options                  The reference being made.
 * @param options.menu             The Navigation Menu that was selected, if there is one.
 * @param options.ref              The post ID the block currently references.
 * @param options.slug             The slug the block currently references.
 * @param options.navigationMenuId The post ID the current reference resolves to.
 *
 * @return The attributes to set, or `undefined` when the reference already stands.
 */
export default function getMenuReferenceAttributes( {
	menu,
	ref,
	slug,
	navigationMenuId,
}: {
	menu?: SelectedNavigationMenu | null;
	ref?: number;
	slug?: string;
	navigationMenuId?: number;
} ): NavigationMenuReference | undefined {
	if ( slug && menu?.slug ) {
		// The reference may already resolve to this menu, as it does when a
		// hand authored `Header Menu` created the `header-menu` the server
		// stored. Leave the slug as it was authored then, rather than
		// rewriting saved markup to no effect.
		const isSameMenu =
			menu.id === navigationMenuId ||
			normalizeNavigationMenuSlug( menu.slug ) ===
				normalizeNavigationMenuSlug( slug );

		if ( isSameMenu && ref === undefined ) {
			return undefined;
		}

		return {
			slug: isSameMenu ? slug : menu.slug,
			ref: undefined,
		};
	}

	return { ref: menu?.id, slug: undefined };
}
