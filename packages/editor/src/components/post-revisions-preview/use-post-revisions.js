/**
 * WordPress dependencies
 */
import { useSelect } from '@wordpress/data';
import { store as coreStore } from '@wordpress/core-data';
import { useMemo } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { store as editorStore } from '../../store';

const EMPTY_ARRAY = [];

/**
 * Custom hook to fetch revisions for the current post.
 *
 * @return {Object} Object containing revisions array, loading state, and count.
 */
export default function usePostRevisions() {
	const { revisions, isLoading, revisionsCount, authors } = useSelect(
		( select ) => {
			const { getCurrentPostId, getCurrentPostType } =
				select( editorStore );
			const { getRevisions, getUsers, isResolving } = select( coreStore );

			const postId = getCurrentPostId();
			const postType = getCurrentPostType();

			if ( ! postId || ! postType ) {
				return {
					revisions: EMPTY_ARRAY,
					isLoading: false,
					revisionsCount: 0,
					authors: EMPTY_ARRAY,
				};
			}

			// Request with 'edit' context to get raw content for parsing.
			const query = { per_page: -1, context: 'edit' };
			const _revisions =
				getRevisions( 'postType', postType, postId, query ) ||
				EMPTY_ARRAY;

			const _isLoading = isResolving( 'getRevisions', [
				'postType',
				postType,
				postId,
				query,
			] );

			// Get authors for enrichment.
			const authorIds = [
				...new Set( _revisions.map( ( r ) => r.author ) ),
			];
			const _authors =
				authorIds.length > 0
					? getUsers( {
							include: authorIds,
							per_page: -1,
							context: 'view',
					  } ) || EMPTY_ARRAY
					: EMPTY_ARRAY;

			return {
				revisions: _revisions,
				isLoading: _isLoading,
				revisionsCount: _revisions.length,
				authors: _authors,
			};
		},
		[]
	);

	// Enrich revisions with author data.
	const enrichedRevisions = useMemo( () => {
		if ( ! revisions.length || ! authors.length ) {
			return revisions;
		}

		return revisions.map( ( revision ) => ( {
			...revision,
			author: authors.find( ( author ) => author.id === revision.author ),
		} ) );
	}, [ revisions, authors ] );

	return {
		revisions: enrichedRevisions,
		isLoading,
		revisionsCount,
	};
}
