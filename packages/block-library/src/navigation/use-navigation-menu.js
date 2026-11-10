import {
	store as coreStore,
	useResourcePermissions,
	useEntityRecords,
} from '@wordpress/core-data';
import { useSelect } from '@wordpress/data';
import {
	getNavigationMenusBySlugArgs,
	PRELOADED_NAVIGATION_MENUS_QUERY,
} from './constants';
import getNavigationMenuBySlug, {
	getQueriedNavigationMenu,
} from './get-navigation-menu-by-slug';

/**
 * Resolves the Navigation Menu referenced by a Navigation block.
 *
 * A block may reference a menu either by post ID (`ref`) or by slug (`slug`).
 * A slug reference is portable across sites, so it wins when both are present.
 *
 * @param {number} [ref]  The referenced Navigation Menu post ID.
 * @param {string} [slug] The referenced Navigation Menu slug.
 *
 * @return {Object} The resolved Navigation Menu and its resolution state.
 */
export default function useNavigationMenu( ref, slug ) {
	const {
		records: navigationMenus,
		isResolving: isResolvingNavigationMenus,
		hasResolved: hasResolvedNavigationMenus,
	} = useEntityRecords(
		'postType',
		`wp_navigation`,
		PRELOADED_NAVIGATION_MENUS_QUERY
	);

	// A slug is resolved against the loaded Navigation Menus, so the menu it
	// points at is only known once that collection has resolved.
	const navigationMenuFromCollection = getNavigationMenuBySlug(
		navigationMenus,
		slug
	);

	// That collection is capped at 100 menus, and is matched against with
	// `cleanForSlug()`, which only approximates `sanitize_title()`. So a slug
	// it does not match may still match a menu the front end renders. Ask the
	// server for that slug before treating the reference as missing: it
	// sanitizes the `slug` parameter the way it sanitized the stored one.
	const shouldQueryBySlug =
		!! slug && hasResolvedNavigationMenus && ! navigationMenuFromCollection;

	const {
		records: navigationMenusMatchingSlug,
		hasResolved: hasResolvedNavigationMenusMatchingSlug,
	} = useEntityRecords( ...getNavigationMenusBySlugArgs( slug ), {
		enabled: shouldQueryBySlug,
	} );

	const resolvedNavigationMenu =
		navigationMenuFromCollection ??
		getQueriedNavigationMenu( navigationMenusMatchingSlug );

	const navigationMenuId = slug ? resolvedNavigationMenu?.id : ref;

	const permissions = useResourcePermissions( {
		kind: 'postType',
		name: 'wp_navigation',
		id: navigationMenuId,
	} );

	const {
		navigationMenu,
		isNavigationMenuResolved,
		isNavigationMenuMissing,
	} = useSelect(
		( select ) => {
			return selectExistingMenu( select, navigationMenuId );
		},
		[ navigationMenuId ]
	);

	// A slug that matches no menu is only "missing" once both the Navigation
	// Menus and the query for the slug have resolved, otherwise the block
	// would flash a deleted menu warning while they load.
	const hasUnmatchedSlug = !! slug && ! navigationMenuId;
	const hasResolvedSlug =
		hasResolvedNavigationMenus &&
		( ! shouldQueryBySlug || hasResolvedNavigationMenusMatchingSlug );

	const {
		// Can the user create navigation menus?
		canCreate: canCreateNavigationMenus,

		// Can the user update the specific navigation menu with the given post ID?
		canUpdate: canUpdateNavigationMenu,

		// Can the user delete the specific navigation menu with the given post ID?
		canDelete: canDeleteNavigationMenu,
		isResolving: isResolvingPermissions,
		hasResolved: hasResolvedPermissions,
	} = permissions;

	const canSwitchNavigationMenu = navigationMenuId
		? navigationMenus?.length > 1
		: navigationMenus?.length > 0;

	return {
		navigationMenu,
		navigationMenuId,
		isNavigationMenuResolved: hasUnmatchedSlug
			? hasResolvedSlug
			: isNavigationMenuResolved,
		isNavigationMenuMissing: hasUnmatchedSlug
			? hasResolvedSlug
			: isNavigationMenuMissing,
		navigationMenus,
		isResolvingNavigationMenus,
		hasResolvedNavigationMenus,
		canSwitchNavigationMenu,
		canUserCreateNavigationMenus: canCreateNavigationMenus,
		isResolvingCanUserCreateNavigationMenus: isResolvingPermissions,
		hasResolvedCanUserCreateNavigationMenus: hasResolvedPermissions,
		canUserUpdateNavigationMenu: canUpdateNavigationMenu,
		hasResolvedCanUserUpdateNavigationMenu: navigationMenuId
			? hasResolvedPermissions
			: undefined,
		canUserDeleteNavigationMenu: canDeleteNavigationMenu,
		hasResolvedCanUserDeleteNavigationMenu: navigationMenuId
			? hasResolvedPermissions
			: undefined,
	};
}

function selectExistingMenu( select, ref ) {
	if ( ! ref ) {
		return {
			isNavigationMenuResolved: false,
			isNavigationMenuMissing: true,
		};
	}

	const { getEntityRecord, getEditedEntityRecord, hasFinishedResolution } =
		select( coreStore );

	const args = [ 'postType', 'wp_navigation', ref ];
	const navigationMenu = getEntityRecord( ...args );
	const editedNavigationMenu = getEditedEntityRecord( ...args );
	const hasResolvedNavigationMenu = hasFinishedResolution(
		'getEditedEntityRecord',
		args
	);

	// Only published Navigation posts are considered valid.
	// Draft Navigation posts are valid only on the editor,
	// requiring a post update to publish to show in frontend.
	// To achieve that, index.php must reflect this validation only for published.
	const isNavigationMenuPublishedOrDraft =
		editedNavigationMenu.status === 'publish' ||
		editedNavigationMenu.status === 'draft';

	return {
		isNavigationMenuResolved: hasResolvedNavigationMenu,
		isNavigationMenuMissing:
			hasResolvedNavigationMenu &&
			( ! navigationMenu || ! isNavigationMenuPublishedOrDraft ),

		// getEditedEntityRecord will return the post regardless of status.
		// Therefore if the found post is not published then we should ignore it.
		navigationMenu: isNavigationMenuPublishedOrDraft
			? editedNavigationMenu
			: null,
	};
}
