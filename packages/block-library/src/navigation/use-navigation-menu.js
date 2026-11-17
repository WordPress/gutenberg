import {
	store as coreStore,
	useResourcePermissions,
	useEntityRecords,
} from '@wordpress/core-data';
import { useSelect } from '@wordpress/data';
import { decodeEntities } from '@wordpress/html-entities';
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

	// Creation-capable users still need the editable collection before a menu
	// is selected so drafts remain available and unsaved inner blocks can be
	// saved as a new Navigation Menu.
	const canUseEditContext =
		hasResolvedPermissions &&
		( canUpdateNavigationMenu || ( ! ref && canCreateNavigationMenus ) );

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
		{ enabled: hasResolvedPermissions && ! canUseEditContext }
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

	// Normalize to the shape of an edited record, where `title` and `content`
	// are strings. The rendered title is HTML-encoded (e.g. `&#8217;`), so it
	// is decoded once here for consumers that display it as text.
	return {
		isNavigationMenuResolved: hasResolvedNavigationMenu,
		isNavigationMenuMissing:
			hasResolvedNavigationMenu && ! isNavigationMenuPublished,
		navigationMenu: isNavigationMenuPublished
			? {
					...navigationMenu,
					title: decodeEntities(
						navigationMenu.title?.rendered ?? ''
					),
					content: navigationMenu.content?.rendered ?? '',
				}
			: null,
	};
}
