/**
 * WordPress dependencies
 */
import { useMemo } from '@wordpress/element';
import { useEntityRecords } from '@wordpress/core-data';
import { useSelect } from '@wordpress/data';
import { store as blockEditorStore } from '@wordpress/block-editor';

export function useBlockComments( postId ) {
	const queryArgs = {
		post: postId,
		type: 'block_comment',
		status: 'all',
		per_page: 100,
	};

	const { records: threads, totalPages } = useEntityRecords(
		'root',
		'comment',
		queryArgs,
		{ enabled: !! postId && typeof postId === 'number' }
	);

	const blocksWithComments = useSelect( ( select ) => {
		const { getBlockAttributes, getClientIdsWithDescendants } =
			select( blockEditorStore );

		return getClientIdsWithDescendants().reduce( ( results, clientId ) => {
			const commentId = getBlockAttributes( clientId )?.blockCommentId;
			if ( commentId ) {
				results[ commentId ] = clientId;
			}
			return results;
		}, {} );
	}, [] );

	// Process comments to build the tree structure.
	const { resultComments, unresolvedSortedThreads } = useMemo( () => {
		// Create a compare to store the references to all objects by id.
		const compare = {};
		const result = [];

		const allComments = threads ?? [];

		// Initialize each object with an empty `reply` array and map blockClientId.
		allComments.forEach( ( item ) => {
			compare[ item.id ] = {
				...item,
				reply: [],
				blockClientId:
					item.parent === 0 ? blocksWithComments[ item.id ] : null,
			};
		} );

		// Iterate over the data to build the tree structure.
		allComments.forEach( ( item ) => {
			if ( item.parent === 0 ) {
				// If parent is 0, it's a root item, push it to the result array.
				result.push( compare[ item.id ] );
			} else if ( compare[ item.parent ] ) {
				// Otherwise, find its parent and push it to the parent's `reply` array.
				compare[ item.parent ].reply.push( compare[ item.id ] );
			}
		} );

		if ( 0 === result?.length ) {
			return { resultComments: [], unresolvedSortedThreads: [] };
		}

		const updatedResult = result.map( ( item ) => ( {
			...item,
			reply: [ ...item.reply ].reverse(),
		} ) );

		const threadIdMap = new Map(
			updatedResult.map( ( thread ) => [ String( thread.id ), thread ] )
		);

		// Get comments by block order, filter out undefined threads, and exclude resolved comments.
		const unresolvedSortedComments = Object.keys( blocksWithComments )
			.map( ( id ) => threadIdMap.get( id ) )
			.filter(
				( thread ) =>
					thread !== undefined && thread.status !== 'approved'
			);

		return {
			resultComments: updatedResult,
			unresolvedSortedThreads: unresolvedSortedComments,
		};
	}, [ threads, blocksWithComments ] );

	return { resultComments, unresolvedSortedThreads, totalPages };
}
