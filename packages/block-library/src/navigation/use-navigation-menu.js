/**
 * WordPress dependencies
 */
import { store as coreStore } from '@wordpress/core-data';
import { useSelect } from '@wordpress/data';

export default function useNavigationMenu( ref ) {
	return useSelect(
		( select ) => {
			const menus = selectNavigationMenus( select, ref );

			return {
				...menus,
				...selectExistingMenu( select, ref ),
				...selectMenuCreatePermissions( select ),
				...selectMenuUpdatePermissions( select, ref ),
				...selectMenuDeletePermissions( select, ref ),
				canSwitchNavigationMenu: ref
					? menus.navigationMenus?.length > 1
					: menus.navigationMenus?.length > 0,
			};
		},
		[ ref ]
	);
}

function selectNavigationMenus( select ) {
	const { getEntityRecords, hasFinishedResolution, isResolving } = select(
		coreStore
	);

	const args = [
		'postType',
		'wp_navigation',
		{ per_page: -1, status: 'publish' },
	];
	return {
		navigationMenus: getEntityRecords( ...args ),
		isResolvingNavigationMenus: isResolving( 'getEntityRecords', args ),
		hasResolvedNavigationMenus: hasFinishedResolution(
			'getEntityRecords',
			args
		),
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
		getEntityRecord,
		getEditedEntityRecord,
		hasFinishedResolution,
	} = select( coreStore );

	const args = [ 'postType', 'wp_navigation', ref ];
	const navigationMenu = getEntityRecord( ...args );
	const editedNavigationMenu = getEditedEntityRecord( ...args );
	const hasResolvedNavigationMenu = hasFinishedResolution(
		'getEditedEntityRecord',
		args
	);

	return {
		isNavigationMenuResolved: hasResolvedNavigationMenu,
		isNavigationMenuMissing: hasResolvedNavigationMenu && ! navigationMenu,

		// getEditedEntityRecord will return the post regardless of status.
		// Therefore if the found post is not published then we should ignore it.
		navigationMenu:
			editedNavigationMenu.status === 'publish'
				? editedNavigationMenu
				: null,
	};
}

function selectMenuCreatePermissions( select ) {
	const { hasFinishedResolution, isResolving, canUser } = select( coreStore );

	const args = [ 'create', 'navigation' ];
	return {
		canUserCreateNavigationMenu: !! canUser( ...args ),
		isResolvingCanUserCreateNavigationMenu: !! isResolving(
			'canUser',
			args
		),
		hasResolvedCanUserCreateNavigationMenu: !! hasFinishedResolution(
			'canUser',
			args
		),
	};
}

function selectMenuUpdatePermissions( select, ref ) {
	if ( ! ref ) {
		return {
			canUserUpdateNavigationMenu: false,
			hasResolvedCanUserUpdateNavigationMenu: false,
		};
	}

	const { hasFinishedResolution, canUser } = select( coreStore );
	const args = [ 'update', 'navigation', ref ];
	return {
		canUserUpdateNavigationMenu: !! canUser( ...args ),
		hasResolvedCanUserUpdateNavigationMenu: !! hasFinishedResolution(
			'canUser',
			args
		),
	};
}

function selectMenuDeletePermissions( select, ref ) {
	if ( ! ref ) {
		return {
			canUserDeleteNavigationMenu: false,
			hasResolvedCanUserDeleteNavigationMenu: false,
		};
	}

	const { hasFinishedResolution, canUser } = select( coreStore );
	const args = [ 'delete', 'navigation', ref ];
	return {
		canUserDeleteNavigationMenu: !! canUser( ...args ),
		hasResolvedCanUserDeleteNavigationMenu: !! hasFinishedResolution(
			'canUser',
			args
		),
	};
}
