/**
 * WordPress dependencies
 */
import {
	store as coreDataStore,
	store as coreStore,
} from '@wordpress/core-data';
import { select, useSelect } from '@wordpress/data';

export default function useNavigationMenu( navigationMenuId, slug ) {
	return useSelect(
		( select ) => {
			const {
				getEditedEntityRecord,
				getEntityRecords,
				hasFinishedResolution,
			} = select( coreStore );

			const navigationMenuSingleArgs = [
				'postType',
				'wp_navigation',
				slug,
			];
			const navigationMenu = slug
				? getEditedEntityRecord( ...navigationMenuSingleArgs )
				: null;
			const hasResolvedNavigationMenu = slug
				? hasFinishedResolution(
						'getEditedEntityRecord',
						navigationMenuSingleArgs
				  )
				: false;

			const navigationMenuMultipleArgs = [
				'postType',
				'wp_navigation',
				{ per_page: -1 },
			];
			const navigationMenus = getEntityRecords(
				...navigationMenuMultipleArgs
			);

			const canSwitchNavigationMenu = slug
				? navigationMenus?.length > 1
				: navigationMenus?.length > 0;

			return {
				isNavigationMenuResolved: hasResolvedNavigationMenu,
				isNavigationMenuMissing:
					! slug || ( hasResolvedNavigationMenu && ! navigationMenu ),
				canSwitchNavigationMenu,
				hasResolvedNavigationMenus: hasFinishedResolution(
					'getEntityRecords',
					navigationMenuMultipleArgs
				),
				navigationMenu,
				navigationMenus,
			};
		},
		[ slug ]
	);
}
