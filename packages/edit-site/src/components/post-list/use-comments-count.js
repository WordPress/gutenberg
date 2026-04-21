import { useMemo } from '@wordpress/element';
import { useSelect } from '@wordpress/data';
import { store as coreStore } from '@wordpress/core-data';

/**
 * Hook to fetch comments counts for a list of post IDs.
 *
 * This hook fetches all comments for the given posts and returns
 * a map of post ID to comments count.
 *
 * @param {number[]} postIds - Array of post IDs to fetch comments for.
 * @return {{ commentsCount: Object, isLoading: boolean }} Object with commentsCount map and loading state.
 */
export default function useCommentsCount( postIds ) {
	const { comments, isLoading } = useSelect(
		( select ) => {
			if ( ! postIds.length ) {
				return { comments: [], isLoading: false };
			}

			const { getEntityRecords } = select( coreStore );
			const records = getEntityRecords( 'root', 'comment', {
				// Using -1 may crash the REST API if there are too many comments, so we use a high number instead.
				// For posts with >100 comments, this count may be incomplete.
				per_page: 100,
				post: postIds,
				context: 'view',
			} );

			return {
				comments: records,
				isLoading: records === null,
			};
		},
		[ postIds ]
	);

	const commentsCount = useMemo( () => {
		const counts = {};

		for ( const comment of comments || [] ) {
			const postId = comment.post;
			if ( postId ) {
				counts[ postId ] = ( counts[ postId ] || 0 ) + 1;
			}
		}

		return counts;
	}, [ comments ] );

	return { commentsCount, isLoading };
}
