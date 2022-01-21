/**
 * WordPress dependencies
 */
import { store as coreStore } from '@wordpress/core-data';
import { useResolveSelect } from '@wordpress/data';

export default function useNavigationMenu( ref ) {
	return useResolveSelect(
		( resolve ) => {
			const {
				canUser,
				getEntityRecord,
				getEditedEntityRecord,
				getEntityRecords,
			} = resolve( coreStore );

			const navigationMenus = getEntityRecords(
				'postType',
				'wp_navigation',
				{ per_page: -1, status: 'publish' }
			);
			const canUserCreate = canUser( 'create', 'navigation' );
			const knownValues = {
				navigationMenus: navigationMenus.data,
				canSwitchNavigationMenu: navigationMenus?.length > 0,
				hasResolvedNavigationMenus: navigationMenus.hasFinished,
				canUserCreateNavigation: canUserCreate.data,
				hasResolvedCanUserCreateNavigation: canUserCreate.hasFinished,
			};

			if ( ! ref ) {
				return {
					...knownValues,
					isNavigationMenuResolved: false,
					isNavigationMenuMissing: true,
					navigationMenu: null,
					canUserUpdateNavigationEntity: undefined,
					hasResolvedCanUserUpdateNavigationEntity: false,
					canUserDeleteNavigationEntity: undefined,
					hasResolvedCanUserDeleteNavigationEntity: false,
				};
			}

			const rawNavigationMenu = getEntityRecord(
				'postType',
				'wp_navigation',
				ref
			);
			const navigationMenu = getEditedEntityRecord(
				'postType',
				'wp_navigation',
				ref
			);

			const canUserUpdate = canUser( 'update', 'navigation', ref );
			const canUserDelete = canUser( 'delete', 'navigation', ref );

			return {
				...knownValues,
				isNavigationMenuResolved: navigationMenu.hasFinished,
				isNavigationMenuMissing:
					navigationMenu.hasFinished && ! rawNavigationMenu.data,
				// getEditedEntityRecord will return the post regardless of status.
				// Therefore if the found post is not published then we should ignore it.
				navigationMenu:
					navigationMenu.data?.status !== 'publish'
						? null
						: navigationMenu.data,
				canUserUpdateNavigationEntity: canUserUpdate.data,
				hasResolvedCanUserUpdateNavigationEntity:
					canUserUpdate.hasFinished,
				canUserDeleteNavigationEntity: canUserDelete.data,
				hasResolvedCanUserDeleteNavigationEntity:
					canUserDelete.hasFinished,
			};
		},
		[ ref ]
	);
}
