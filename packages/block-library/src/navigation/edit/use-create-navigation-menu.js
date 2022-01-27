/**
 * WordPress dependencies
 */
import { serialize } from '@wordpress/blocks';
import { useEntityRecordCreate } from '@wordpress/core-data';
import { useCallback } from '@wordpress/element';

/**
 * Internal dependencies
 */
import useGenerateDefaultNavigationTitle from './use-generate-default-navigation-title';

export default function useCreateNavigationMenu( clientId ) {
	const { create } = useEntityRecordCreate( 'postType', 'wp_navigation' );
	const generateDefaultTitle = useGenerateDefaultNavigationTitle( clientId );

	// This callback uses data from the two placeholder steps and only creates
	// a new navigation menu when the user completes the final step.
	return useCallback(
		async ( title = null, blocks = [] ) => {
			if ( ! title ) {
				title = await generateDefaultTitle();
			}

			return await create( {
				title,
				content: serialize( blocks ),
				status: 'publish',
			} );
		},
		[ serialize, create ]
	);
}
