/**
 * WordPress dependencies
 */
import type { GlobalStylesConfig } from '@wordpress/global-styles-engine';
import { store as coreStore } from '@wordpress/core-data';
import { useSelect } from '@wordpress/data';
import { useMemo } from '@wordpress/element';

export function useUserGlobalStyles( id: string ) {
	const { userGlobalStyles } = useSelect(
		( select ) => {
			const { getEntityRecord, getEditedEntityRecord, canUser } =
				select( coreStore );

			/*
			 * Ensure that the global styles ID request is complete by testing `_globalStylesId`,
			 * before firing off the `canUser` OPTIONS request for user capabilities, otherwise it will
			 * fetch `/wp/v2/global-styles` instead of `/wp/v2/global-styles/{id}`.
			 * NOTE: Please keep in sync any preload paths sent to `block_editor_rest_api_preload()`,
			 * or set using the `block_editor_rest_api_preload_paths` filter, if this changes.
			 */
			const userCanEditGlobalStyles = canUser( 'update', {
				kind: 'root',
				name: 'globalStyles',
				id,
			} );

			let record;
			if (
				/*
				 * Test that the OPTIONS request for user capabilities is complete
				 * before fetching the global styles entity record.
				 * This is to avoid fetching the global styles entity unnecessarily.
				 */
				typeof userCanEditGlobalStyles === 'boolean'
			) {
				/*
				 * Fetch the global styles entity record based on the user's capabilities.
				 * The default context is `edit` for users who can edit global styles.
				 * Otherwise, the context is `view`.
				 */
				if ( userCanEditGlobalStyles ) {
					record = getEditedEntityRecord(
						'root',
						'globalStyles',
						id
					);
				} else {
					record = getEntityRecord( 'root', 'globalStyles', id, {
						context: 'view',
					} );
				}
			}

			return {
				userGlobalStyles: record,
			};
		},
		[ id ]
	);

	return useMemo( () => {
		if ( ! userGlobalStyles ) {
			return {
				user: undefined,
			};
		}

		const user = userGlobalStyles as GlobalStylesConfig;

		return {
			user,
		};
	}, [ userGlobalStyles ] );
}
