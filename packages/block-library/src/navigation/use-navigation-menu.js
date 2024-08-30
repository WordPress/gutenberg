/**
 * WordPress dependencies
 */
import {
	store as coreStore,
	useResourcePermissions,
	useEntityRecords,
} from '@wordpress/core-data';
import { useSelect } from '@wordpress/data';

/**
 * Internal dependencies
 */
import { PRELOADED_NAVIGATION_MENUS_QUERY } from './constants';

export default function useNavigationMenu( ref ) {
	const permissions = useResourcePermissions( {
		kind: 'postType',
		name: 'wp_navigation',
		id: ref,
	} );

	const {
		navigationMenu,
		isNavigationMenuResolved,
		isNavigationMenuMissing,
	} = useSelect(
		( select ) => {
			return selectExistingMenu( select, ref );
		},
		[ ref ]
	);

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

	const {
		records: navigationMenus,
		isResolving: isResolvingNavigationMenus,
		hasResolved: hasResolvedNavigationMenus,
	} = useEntityRecords(
		'postType',
		`wp_navigation`,
		PRELOADED_NAVIGATION_MENUS_QUERY
	);

	const canSwitchNavigationMenu = ref
		? navigationMenus?.length > 1
		: navigationMenus?.length > 0;

	return {
		navigationMenu,
		isNavigationMenuResolved,
		isNavigationMenuMissing,
		navigationMenus,
		isResolvingNavigationMenus,
		hasResolvedNavigationMenus,
		canSwitchNavigationMenu,
		canUserCreateNavigationMenus: canCreateNavigationMenus,
		isResolvingCanUserCreateNavigationMenus: isResolvingPermissions,
		hasResolvedCanUserCreateNavigationMenus: hasResolvedPermissions,
		canUserUpdateNavigationMenu: canUpdateNavigationMenu,
		hasResolvedCanUserUpdateNavigationMenu: ref
			? hasResolvedPermissions
			: undefined,
		canUserDeleteNavigationMenu: canDeleteNavigationMenu,
		hasResolvedCanUserDeleteNavigationMenu: ref
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
