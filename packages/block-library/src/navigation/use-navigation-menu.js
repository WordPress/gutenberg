/**
 * WordPress dependencies
 */
import { store as coreStore } from '@wordpress/core-data';
import { useSelect } from '@wordpress/data';

export default function useNavigationMenu( ref ) {
	return useSelect(
		( select ) => {
			const {
				getEntityRecord,
				getEditedEntityRecord,
				getEntityRecords,
				hasFinishedResolution,
				canUser,
			} = select( coreStore );

			const navigationMenuSingleArgs = [
				'postType',
				'wp_navigation',
				ref,
			];
			const rawNavigationMenu = ref
				? getEntityRecord( ...navigationMenuSingleArgs )
				: null;
			const navigationMenu = ref
				? getEditedEntityRecord( ...navigationMenuSingleArgs )
				: null;

			const hasResolvedNavigationMenu = ref
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

			const canSwitchNavigationMenu = ref
				? navigationMenus?.length > 1
				: navigationMenus?.length > 0;

			return {
				isNavigationMenuResolved: hasResolvedNavigationMenu,
				isNavigationMenuMissing:
					! ref ||
					( hasResolvedNavigationMenu && ! rawNavigationMenu ),
				canSwitchNavigationMenu,
				hasResolvedNavigationMenus: hasFinishedResolution(
					'getEntityRecords',
					navigationMenuMultipleArgs
				),
				navigationMenu,
				navigationMenus,
				canUserUpdateNavigationEntity: ref
					? canUser( 'update', 'navigation', ref )
					: undefined,
				hasResolvedCanUserUpdateNavigationEntity: hasFinishedResolution(
					'canUser',
					[ 'update', 'navigation', ref ]
				),
				canUserDeleteNavigationEntity: ref
					? canUser( 'delete', 'navigation', ref )
					: undefined,
				hasResolvedCanUserDeleteNavigationEntity: hasFinishedResolution(
					'canUser',
					[ 'delete', 'navigation', ref ]
				),
			};
		},
		[ ref ]
	);
}
