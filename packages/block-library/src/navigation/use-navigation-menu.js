/**
 * WordPress dependencies
 */
import { store as coreStore } from '@wordpress/core-data';
import { useSelect } from '@wordpress/data';

export default function useNavigationMenu( navigationMenuId ) {
	return useSelect(
		( select ) => {
			const {
				getEntityRecord,
				getEditedEntityRecord,
				getEntityRecords,
				hasFinishedResolution,
			} = select( coreStore );

			const navigationMenuSingleArgs = [
				'postType',
				'wp_navigation',
				navigationMenuId,
			];
			const rawNavigationMenu = navigationMenuId
				? getEntityRecord( ...navigationMenuSingleArgs )
				: null;
			let navigationMenu = navigationMenuId
				? getEditedEntityRecord( ...navigationMenuSingleArgs )
				: null;

			// getEditedEntityRecord will return the post regardless of status.
			// Therefore if the found post is not published then we should ignore it.
			if ( navigationMenu?.status !== 'publish' ) {
				navigationMenu = null;
			}

			const hasResolvedNavigationMenu = navigationMenuId
				? hasFinishedResolution(
						'getEditedEntityRecord',
						navigationMenuSingleArgs
				  )
				: false;

			const navigationMenuMultipleArgs = [
				'postType',
				'wp_navigation',
				{ per_page: -1, status: 'publish' },
			];
			const navigationMenus = getEntityRecords(
				...navigationMenuMultipleArgs
			);

			const canSwitchNavigationMenu = navigationMenuId
				? navigationMenus?.length > 1
				: navigationMenus?.length > 0;

			return {
				isNavigationMenuResolved: hasResolvedNavigationMenu,
				isNavigationMenuMissing:
					! navigationMenuId ||
					( hasResolvedNavigationMenu && ! rawNavigationMenu ),
				canSwitchNavigationMenu,
				hasResolvedNavigationMenus: hasFinishedResolution(
					'getEntityRecords',
					navigationMenuMultipleArgs
				),
				navigationMenu,
				navigationMenus,
			};
		},
		[ navigationMenuId ]
	);
}
