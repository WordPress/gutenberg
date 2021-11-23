/**
 * WordPress dependencies
 */
import { serialize } from '@wordpress/blocks';
import { store as coreStore } from '@wordpress/core-data';
import { useDispatch } from '@wordpress/data';
import { useCallback } from '@wordpress/element';

/**
 * Internal dependencies
 */
import useDefaultNavigationTitle from './use-default-navigation-title';

export default function useCreateNavigationMenu( clientId ) {
	const { saveEntityRecord } = useDispatch( coreStore );
	const defaultTitle = useDefaultNavigationTitle( clientId );

	// This callback uses data from the two placeholder steps and only creates
	// a new navigation menu when the user completes the final step.
	return useCallback(
		async ( title = null, blocks = [] ) => {
			const record = {
				title: title || defaultTitle,
				content: serialize( blocks ),
				status: 'publish',
			};

			return await saveEntityRecord(
				'postType',
				'wp_navigation',
				record
			);
		},
		[ serialize, saveEntityRecord ]
	);
}
