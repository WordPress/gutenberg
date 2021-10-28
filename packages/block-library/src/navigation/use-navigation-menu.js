/**
 * WordPress dependencies
 */
import { store as coreStore } from '@wordpress/core-data';
import { useSelect } from '@wordpress/data';

export default function useNavigationMenu(
	navigationMenuId,
	navigationAreaId
) {
	return useSelect(
		( select ) => {
			const {
				getEditedEntityRecord,
				getEntityRecords,
				hasFinishedResolution,
			} = select( coreStore );

			let navigationMenu;
			let hasResolvedNavigationMenu;

			if ( navigationAreaId ) {
				const byAreaArgs = [
					'postType',
					'wp_navigation',
					{
						wp_navigation_area: navigationAreaId,
					},
				];

				const navigationMenus = getEntityRecords(
					'postType',
					'wp_navigation',
					{ wp_navigation_area: navigationAreaId }
				);

				navigationMenu = navigationMenus?.length
					? navigationMenus[ 0 ]
					: null;

				hasResolvedNavigationMenu = navigationAreaId
					? hasFinishedResolution( 'getEntityRecords', byAreaArgs )
					: false;
			} else {
				const navigationMenuSingleArgs = [
					'postType',
					'wp_navigation',
					navigationMenuId,
				];
				navigationMenu = navigationMenuId
					? getEditedEntityRecord( ...navigationMenuSingleArgs )
					: null;
				hasResolvedNavigationMenu = navigationMenuId
					? hasFinishedResolution(
							'getEditedEntityRecord',
							navigationMenuSingleArgs
					  )
					: false;
			}

			const navigationMenuMultipleArgs = [ 'postType', 'wp_navigation' ];
			const navigationMenus = getEntityRecords(
				...navigationMenuMultipleArgs
			);

			const canSwitchNavigationMenu = navigationMenuId
				? navigationMenus?.length > 1
				: navigationMenus?.length > 0;

			return {
				isNavigationMenuResolved: hasResolvedNavigationMenu,
				isNavigationMenuMissing:
					hasResolvedNavigationMenu && ! navigationMenu,
				canSwitchNavigationMenu,
				hasResolvedNavigationMenu: hasFinishedResolution(
					'getEntityRecords',
					navigationMenuMultipleArgs
				),
				navigationMenu,
				navigationMenus,
			};
		},
		[ navigationMenuId, navigationAreaId ]
	);
}
