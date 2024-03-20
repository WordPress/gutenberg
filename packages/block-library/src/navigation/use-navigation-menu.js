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
import { isNumeric } from './edit/utils';

/**
 * Internal dependencies
 */
import { PRELOADED_NAVIGATION_MENUS_QUERY } from './constants';

export default function useNavigationMenu( ref ) {
	const permissions = useResourcePermissions( 'navigation', ref );

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

	const { canCreate, canUpdate, canDelete, isResolving, hasResolved } =
		permissions;

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
		canUserCreateNavigationMenu: canCreate,
		isResolvingCanUserCreateNavigationMenu: isResolving,
		hasResolvedCanUserCreateNavigationMenu: hasResolved,
		canUserUpdateNavigationMenu: canUpdate,
		hasResolvedCanUserUpdateNavigationMenu: ref ? hasResolved : undefined,
		canUserDeleteNavigationMenu: canDelete,
		hasResolvedCanUserDeleteNavigationMenu: ref ? hasResolved : undefined,
	};
}

function selectExistingMenu( select, ref ) {
	if ( ! ref ) {
		return {
			isNavigationMenuResolved: false,
			isNavigationMenuMissing: true,
		};
	}

	const {
		getNavigationMenuBySlug,
		getNavigationMenu,
		// getEntityRecord,
		getEditedEntityRecord,
		hasFinishedResolution,
	} = select( coreStore );

	// const args = [ 'postType', 'wp_navigation', ref ];
	// const navigationMenu = getEntityRecord( ...args );

	const navigationMenu = isNumeric( ref )
		? getNavigationMenu( ref )
		: getNavigationMenuBySlug( ref );

	const hasNavigationMenu = !! navigationMenu;

	const editedNavigationMenu = hasNavigationMenu
		? getEditedEntityRecord(
				'postType',
				'wp_navigation',
				navigationMenu.id
		  )
		: null;

	const hasResolvedNavigationMenu = hasFinishedResolution(
		'getEditedEntityRecord',
		[ 'postType', 'wp_navigation', navigationMenu?.id ]
	);

	// Only published Navigation posts are considered valid.
	// Draft Navigation posts are valid only on the editor,
	// requiring a post update to publish to show in frontend.
	// To achieve that, index.php must reflect this validation only for published.
	const isNavigationMenuPublishedOrDraft =
		editedNavigationMenu?.status === 'publish' ||
		editedNavigationMenu?.status === 'draft';

	console.log( {
		navigationMenu,
		editedNavigationMenu,
		hasResolvedNavigationMenu,
		isNavigationMenuPublishedOrDraft,
	} );

	return {
		isNavigationMenuResolved: hasResolvedNavigationMenu,
		isNavigationMenuMissing:
			hasResolvedNavigationMenu &&
			( ! hasNavigationMenu || ! isNavigationMenuPublishedOrDraft ),

		// getEditedEntityRecord will return the post regardless of status.
		// Therefore if the found post is not published then we should ignore it.
		navigationMenu: isNavigationMenuPublishedOrDraft
			? editedNavigationMenu
			: null,
	};
}
