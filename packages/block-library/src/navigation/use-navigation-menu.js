/**
 * WordPress dependencies
 */
import {
	store as coreDataStore,
	store as coreStore,
} from '@wordpress/core-data';
import { useState } from '@wordpress/element';
import { useSelect, useDispatch } from '@wordpress/data';

export default function useNavigationMenu( slug ) {
	const dispatch = useDispatch();
	const [ created, setCreated ] = useState( false ); // @TODO check with core data
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

			const navigationMenuMultipleArgs = [
				'postType',
				'wp_navigation',
				{ per_page: -1 },
			];
			const navigationMenus = getEntityRecords(
				...navigationMenuMultipleArgs
			);

			let navigationMenu = null;

			if ( slug ) {
				navigationMenu = getEditedEntityRecord(
					...navigationMenuSingleArgs
				);
				if (
					! navigationMenu?.id &&
					! created /* && hasResolvedNavigationMenu */
				) {
					setCreated( true );
					const record = {
						slug: slug,
						name: slug,
						post_name: slug,
					};
					dispatch( coreStore )
						.saveEntityRecord( 'postType', 'wp_navigation', record )
					dispatch( coreStore )
						.receiveEntityRecords( 'postType', 'wp_navigation', [
							{ ...record, id: slug },
						] )
					navigationMenu = getEditedEntityRecord(
						...navigationMenuSingleArgs
					);
				}
			}

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
		[ slug, created ]
	);
}
