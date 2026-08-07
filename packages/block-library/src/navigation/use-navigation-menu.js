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
import {
	PRELOADED_NAVIGATION_MENUS_QUERY,
	VIEW_NAVIGATION_MENUS_QUERY,
} from './constants';

export default function useNavigationMenu( ref ) {
	const permissions = useResourcePermissions( {
		kind: 'postType',
		name: 'wp_navigation',
		id: ref,
	} );

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
		records: publishedNavigationMenus,
		isResolving: isResolvingPublishedNavigationMenus,
		hasResolved: hasResolvedPublishedNavigationMenus,
	} = useEntityRecords(
		'postType',
		`wp_navigation`,
		VIEW_NAVIGATION_MENUS_QUERY
	);

	// Creation-capable users still need the editable collection before a menu
	// is selected so drafts remain available and unsaved inner blocks can be
	// saved as a new Navigation Menu.
	const canUseEditContext =
		hasResolvedPermissions &&
		( canUpdateNavigationMenu || ( ! ref && canCreateNavigationMenus ) );

	const {
		records: editableNavigationMenus,
		isResolving: isResolvingEditableNavigationMenus,
		hasResolved: hasResolvedEditableNavigationMenus,
	} = useEntityRecords(
		'postType',
		'wp_navigation',
		PRELOADED_NAVIGATION_MENUS_QUERY,
		{ enabled: canUseEditContext }
	);

	const navigationMenus = canUseEditContext
		? editableNavigationMenus
		: publishedNavigationMenus;
	const isResolvingNavigationMenus = canUseEditContext
		? isResolvingEditableNavigationMenus
		: isResolvingPublishedNavigationMenus;
	const hasResolvedNavigationMenus = canUseEditContext
		? hasResolvedEditableNavigationMenus
		: hasResolvedPublishedNavigationMenus;

	const {
		navigationMenu,
		isNavigationMenuResolved,
		isNavigationMenuMissing,
	} = useSelect(
		( select ) => {
			if ( ! hasResolvedPermissions ) {
				return {
					isNavigationMenuResolved: false,
					isNavigationMenuMissing: false,
				};
			}

			return canUseEditContext
				? selectEditableMenu( select, ref )
				: selectViewableMenu( select, ref );
		},
		[ ref, hasResolvedPermissions, canUseEditContext ]
	);

	const canSwitchNavigationMenu = ref
		? navigationMenus?.length > 1
		: navigationMenus?.length > 0;

	return {
		navigationMenu,
		isNavigationMenuResolved,
		isNavigationMenuMissing,
		navigationMenus,
		publishedNavigationMenus,
		isResolvingNavigationMenus,
		hasResolvedNavigationMenus,
		isResolvingPublishedNavigationMenus,
		hasResolvedPublishedNavigationMenus,
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

function selectEditableMenu( select, ref ) {
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

function selectViewableMenu( select, ref ) {
	if ( ! ref ) {
		return {
			isNavigationMenuResolved: false,
			isNavigationMenuMissing: true,
		};
	}

	const { getEntityRecord, hasFinishedResolution } = select( coreStore );
	const args = [ 'postType', 'wp_navigation', ref, { context: 'view' } ];
	const navigationMenu = getEntityRecord( ...args );
	const hasResolvedNavigationMenu = hasFinishedResolution(
		'getEntityRecord',
		args
	);
	const isNavigationMenuPublished = navigationMenu?.status === 'publish';

	return {
		isNavigationMenuResolved: hasResolvedNavigationMenu,
		isNavigationMenuMissing:
			hasResolvedNavigationMenu && ! isNavigationMenuPublished,
		navigationMenu: isNavigationMenuPublished
			? {
					...navigationMenu,
					title:
						navigationMenu.title?.rendered ?? navigationMenu.title,
					content:
						navigationMenu.content?.rendered ??
						navigationMenu.content,
			  }
			: null,
	};
}
