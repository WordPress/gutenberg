/**
 * WordPress dependencies
 */
import { useState, useEffect, useMemo } from '@wordpress/element';
import { useSelect } from '@wordpress/data';
import apiFetch from '@wordpress/api-fetch'; // eslint-disable-line no-restricted-imports

/**
 * Internal dependencies
 */
import { store as blockEditorStore } from '../../store';

export function useBlockComments( postId ) {
	// State to store fetched comment threads
	const [ threads, setThreads ] = useState( null );

	// Get block data from store
	const { getBlockAttributes, clientIds } = useSelect( ( select ) => {
		const { getBlockAttributes: getAttrs, getClientIdsWithDescendants } =
			select( blockEditorStore );

		return {
			getBlockAttributes: getAttrs,
			clientIds: getClientIdsWithDescendants(),
		};
	}, [] );

	// Fetch comment threads from WordPress REST API
	useEffect( () => {
		// Only fetch if we have a valid postId
		if ( ! postId || typeof postId !== 'number' ) {
			return;
		}

		// Fetch comments using apiFetch
		apiFetch( {
			path: `/wp/v2/comments?post=${ postId }&type=note&status=all&per_page=100`,
		} )
			.then( ( comments ) => {
				setThreads( comments );
			} )
			.catch( () => {
				setThreads( [] );
			} );
	}, [ postId ] );

	// Process comments to build the tree structure and map to blocks
	const { resultComments, unresolvedSortedThreads } = useMemo( () => {
		if ( ! threads || threads.length === 0 ) {
			return { resultComments: [], unresolvedSortedThreads: [] };
		}

		// Map clientIds to their comment IDs via metadata.noteId
		const blocksWithComments = clientIds.reduce( ( results, clientId ) => {
			const commentId = getBlockAttributes( clientId )?.metadata?.noteId;
			if ( commentId ) {
				results[ clientId ] = commentId;
			}
			return results;
		}, {} );

		// Create a map to store references to all comment objects by id
		const compare = {};
		const result = [];

		// Create a reverse map for faster lookup (commentId -> clientId)
		const commentIdToBlockClientId = Object.keys(
			blocksWithComments
		).reduce( ( mapping, clientId ) => {
			mapping[ blocksWithComments[ clientId ] ] = clientId;
			return mapping;
		}, {} );

		// Initialize each comment object with an empty `reply` array and map blockClientId
		threads.forEach( ( item ) => {
			const itemBlock = commentIdToBlockClientId[ item.id ];

			compare[ item.id ] = {
				...item,
				reply: [],
				blockClientId: item.parent === 0 ? itemBlock : null,
			};
		} );

		// Build the tree structure by linking replies to their parents
		threads.forEach( ( item ) => {
			if ( item.parent === 0 ) {
				// If parent is 0, it's a root item
				result.push( compare[ item.id ] );
			} else if ( compare[ item.parent ] ) {
				// Otherwise, add to parent's reply array
				compare[ item.parent ].reply.push( compare[ item.id ] );
			}
		} );

		if ( 0 === result?.length ) {
			return { resultComments: [], unresolvedSortedThreads: [] };
		}

		// Reverse replies so newest are at the top
		const updatedResult = result.map( ( item ) => ( {
			...item,
			reply: [ ...item.reply ].reverse(),
		} ) );

		// Create a map for quick thread lookup
		const threadIdMap = new Map(
			updatedResult.map( ( thread ) => [ String( thread.id ), thread ] )
		);

		// Determine which threads are linked to existing blocks
		const mappedIds = new Set(
			Object.values( blocksWithComments ).map( ( id ) => String( id ) )
		);

		// Get unresolved comments by block order
		const unresolvedSortedComments = Object.values( blocksWithComments )
			.map( ( commentId ) => threadIdMap.get( String( commentId ) ) )
			.filter(
				( thread ) => thread !== undefined && thread.status === 'hold'
			);

		// Get resolved comments by block order
		const resolvedSortedComments = Object.values( blocksWithComments )
			.map( ( commentId ) => threadIdMap.get( String( commentId ) ) )
			.filter(
				( thread ) =>
					thread !== undefined && thread.status === 'approved'
			);

		// Append orphaned notes (whose related block was deleted or missing)
		const orphanedComments = updatedResult.filter(
			( thread ) => ! mappedIds.has( String( thread.id ) )
		);

		const allSortedComments = [
			...unresolvedSortedComments,
			...resolvedSortedComments,
			...orphanedComments,
		];

		return {
			resultComments: allSortedComments,
			unresolvedSortedThreads: unresolvedSortedComments,
		};
	}, [ threads, clientIds, getBlockAttributes ] );

	return {
		resultComments,
		unresolvedSortedThreads,
	};
}
