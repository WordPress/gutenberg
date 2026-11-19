import {
	store as coreStore,
	useResourcePermissions,
	useEntityRecords,
} from '@wordpress/core-data';
import { useSelect } from '@wordpress/data';
import { useMemo } from '@wordpress/element';
import { decodeEntities } from '@wordpress/html-entities';
import {
	PRELOADED_NAVIGATION_MENUS_QUERY,
	VIEW_NAVIGATION_MENUS_QUERY,
} from './constants';

export default function useNavigationMenu( ref ) {
	// Whether the user can create menus is a collection-level check, which the
	// Site Editor preloads, so it resolves without waiting for the check on the
	// specific menu.
	const {
		canCreate: canCreateNavigationMenus,
		isResolving: isResolvingCanCreateNavigationMenus,
		hasResolved: hasResolvedCanCreateNavigationMenus,
	} = useResourcePermissions( {
		kind: 'postType',
		name: 'wp_navigation',
	} );

	const {
		// Can the user update the specific navigation menu with the given post ID?
		canUpdate: canUpdateNavigationMenu,

		// Can the user delete the specific navigation menu with the given post ID?
		canDelete: canDeleteNavigationMenu,
		hasResolved: hasResolvedPermissions,
	} = useResourcePermissions( {
		kind: 'postType',
		name: 'wp_navigation',
		id: ref,
	} );

	// Users who can create menus use the editable records straight away, so
	// that drafts stay available, unsaved inner blocks can be saved as a new
	// menu, and a deleted menu can be replaced. Other users wait for the check
	// on the specific menu.
	const canCreateMenusResolved =
		hasResolvedCanCreateNavigationMenus && canCreateNavigationMenus;
	const hasResolvedDataSource =
		canCreateMenusResolved || hasResolvedPermissions;
	const canUseEditContext =
		canCreateMenusResolved ||
		( hasResolvedPermissions && canUpdateNavigationMenu );

	// Users who cannot edit the menu only get published menus in view context.
	// Wait for permissions so that users who can edit menus don't make an
	// extra request.
	const {
		records: publishedNavigationMenus,
		isResolving: isResolvingPublishedNavigationMenus,
		hasResolved: hasResolvedPublishedNavigationMenus,
	} = useEntityRecords(
		'postType',
		'wp_navigation',
		VIEW_NAVIGATION_MENUS_QUERY,
		{ enabled: hasResolvedDataSource && ! canUseEditContext }
	);

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
		navigationMenu: selectedNavigationMenu,
		isNavigationMenuResolved,
		isNavigationMenuMissing,
	} = useSelect(
		( select ) => {
			if ( ! hasResolvedDataSource ) {
				return {
					isNavigationMenuResolved: false,
					isNavigationMenuMissing: false,
				};
			}

			return canUseEditContext
				? selectEditableMenu( select, ref )
				: selectViewableMenu( select, ref );
		},
		[ ref, hasResolvedDataSource, canUseEditContext ]
	);

	// View-context records are normalized outside the selector, so that the
	// selector returns the stored record and doesn't trigger a re-render on
	// every store update.
	const navigationMenu = useMemo(
		() =>
			canUseEditContext
				? selectedNavigationMenu
				: normalizeViewableMenu( selectedNavigationMenu ),
		[ canUseEditContext, selectedNavigationMenu ]
	);

	// The user can see the menu but not edit it. A menu that is missing, for
	// example because it was deleted, isn't read-only.
	const isNavigationMenuReadOnly =
		!! ref &&
		hasResolvedPermissions &&
		! canUpdateNavigationMenu &&
		isNavigationMenuResolved &&
		! isNavigationMenuMissing;

	const canSwitchNavigationMenu = ref
		? navigationMenus?.length > 1
		: navigationMenus?.length > 0;

	return {
		navigationMenu,
		isNavigationMenuResolved,
		isNavigationMenuMissing,
		isNavigationMenuReadOnly,
		navigationMenus,
		isResolvingNavigationMenus,
		hasResolvedNavigationMenus,
		canSwitchNavigationMenu,
		canUserCreateNavigationMenus: canCreateNavigationMenus,
		isResolvingCanUserCreateNavigationMenus:
			isResolvingCanCreateNavigationMenus,
		hasResolvedCanUserCreateNavigationMenus:
			hasResolvedCanCreateNavigationMenus,
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
		navigationMenu: isNavigationMenuPublished ? navigationMenu : null,
	};
}

/**
 * Normalizes a view-context record to the shape of an edited record, where
 * `title` and `content` are strings. The rendered title is HTML-encoded (e.g.
 * `&#8217;`), so it is decoded once here for consumers that display it as text.
 *
 * @param {Object|null} navigationMenu The view-context Navigation Menu record.
 * @return {Object|null} The normalized record.
 */
function normalizeViewableMenu( navigationMenu ) {
	if ( ! navigationMenu ) {
		return navigationMenu;
	}

	return {
		...navigationMenu,
		title: decodeEntities( navigationMenu.title?.rendered ?? '' ),
		content: navigationMenu.content?.rendered ?? '',
	};
}
