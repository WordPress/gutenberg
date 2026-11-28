import { store as coreStore } from '@wordpress/core-data';
import { useSelect } from '@wordpress/data';

/**
 * Hook to fetch the singular label for the current post type.
 *
 * @param contextPostType Context provided post type.
 */
export function usePostTypeLabel( contextPostType?: string ) {
	const currentPostType = useSelect( ( select ) => {
		// Access core/editor by string to avoid @wordpress/editor dependency.
		// eslint-disable-next-line @wordpress/data-no-store-string-literals
		const { getCurrentPostType } = select( 'core/editor' ) as {
			getCurrentPostType: () => string | null;
		};
		return getCurrentPostType();
	}, [] );

	// Fetch the post type label from the core data store
	return useSelect(
		( select ) => {
			const { getPostType } = select( coreStore );
			const postTypeSlug = contextPostType || currentPostType;
			const postType = getPostType( postTypeSlug! ) as
				{ labels?: { singular_name?: string } } | undefined;

			// Return the singular name of the post type
			return {
				postTypeLabel: postType ? postType.labels?.singular_name : '',
			};
		},
		[ contextPostType, currentPostType ]
	);
}
