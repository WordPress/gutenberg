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
				isResolving,
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
			let navigationMenu = ref
				? getEditedEntityRecord( ...navigationMenuSingleArgs )
				: null;

			// getEditedEntityRecord will return the post regardless of status.
			// Therefore if the found post is not published then we should ignore it.
			if ( navigationMenu?.status !== 'publish' ) {
				navigationMenu = null;
			}

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
				canUserUpdateNavigationMenu: ref
					? canUser( 'update', 'navigation', ref )
					: undefined,
				hasResolvedCanUserUpdateNavigationMenu: hasFinishedResolution(
					'canUser',
					[ 'update', 'navigation', ref ]
				),
				canUserDeleteNavigationMenu: ref
					? canUser( 'delete', 'navigation', ref )
					: undefined,
				hasResolvedCanUserDeleteNavigationMenu: hasFinishedResolution(
					'canUser',
					[ 'delete', 'navigation', ref ]
				),
				canUserCreateNavigationMenu: canUser( 'create', 'navigation' ),
				isResolvingCanUserCreateNavigationMenu: isResolving(
					'canUser',
					[ 'create', 'navigation' ]
				),
				hasResolvedCanUserCreateNavigationMenu: hasFinishedResolution(
					'canUser',
					[ 'create', 'navigation' ]
				),
			};
		},
		[ ref ]
	);
}
