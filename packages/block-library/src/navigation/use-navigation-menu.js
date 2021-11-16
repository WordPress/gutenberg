/**
 * WordPress dependencies
 */
import {
	store as coreDataStore,
	store as coreStore,
} from '@wordpress/core-data';
import { useSelect, useDispatch } from '@wordpress/data';

export default function useNavigationMenu( slug ) {
	const dispatch = useDispatch();
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

			const hasResolvedNavigationMenu = slug
				? hasFinishedResolution(
						'getEditedEntityRecord',
						navigationMenuSingleArgs
				  )
				: false;

			let navigationMenu = null;

			if ( slug ) {
				navigationMenu = getEditedEntityRecord( ...navigationMenuSingleArgs );
				if ( ! navigationMenu?.id /* && hasResolvedNavigationMenu */ ) {
					// This could be a mock resolver or transform into a new way of creating entities in Gutenberg
					dispatch(coreStore).receiveEntityRecords(
						'postType',
						'wp_navigation',
						[{
							id: slug,
							slug: slug,
							name: slug,
							blocks: [],
							content: ""
						}]
					);
					navigationMenu = getEditedEntityRecord( ...navigationMenuSingleArgs );
				}
			}

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
