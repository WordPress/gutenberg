/**
 * WordPress dependencies
 */
import { useMemo } from '@wordpress/element';
import { useEntityBlockEditor, useEntityRecords } from '@wordpress/core-data';

/**
 * Internal dependencies
 */
import { getCommentIdsFromBlocks } from './utils';

export function useBlockComments( postId, postType ) {
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

	const [ blocks ] = useEntityBlockEditor( 'postType', postType, {
		id: postId,
	} );

	// Process comments to build the tree structure.
	const { resultComments, unresolvedSortedThreads } = useMemo( () => {
		// Create a compare to store the references to all objects by id.
		const compare = {};
		const result = [];

		const allComments = threads ?? [];

		// Initialize each object with an empty `reply` array.
		allComments.forEach( ( item ) => {
			compare[ item.id ] = { ...item, reply: [] };
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

		const blockCommentIds = getCommentIdsFromBlocks( blocks );

		const threadIdMap = new Map(
			updatedResult.map( ( thread ) => [ thread.id, thread ] )
		);

		// Get comments by block order, filter out undefined threads, and exclude resolved comments.
		const unresolvedSortedComments = blockCommentIds
			.map( ( id ) => threadIdMap.get( id ) )
			.filter(
				( thread ) =>
					thread !== undefined && thread.status !== 'approved'
			);

		return {
			resultComments: updatedResult,
			unresolvedSortedThreads: unresolvedSortedComments,
		};
	}, [ threads, blocks ] );

	return { resultComments, unresolvedSortedThreads, totalPages };
}
