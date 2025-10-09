/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { useEffect, useMemo } from '@wordpress/element';
import { useEntityRecords, store as coreStore } from '@wordpress/core-data';
import { useDispatch, useRegistry, useSelect } from '@wordpress/data';
import { store as blockEditorStore } from '@wordpress/block-editor';
import { store as noticesStore } from '@wordpress/notices';
import { decodeEntities } from '@wordpress/html-entities';
import { store as interfaceStore } from '@wordpress/interface';

/**
 * Internal dependencies
 */
import { store as editorStore } from '../../store';
import { collabSidebarName } from './constants';

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

	const { getBlockAttributes } = useSelect( blockEditorStore );
	const { clientIds } = useSelect( ( select ) => {
		const { getClientIdsWithDescendants } = select( blockEditorStore );
		return {
			clientIds: getClientIdsWithDescendants(),
		};
	}, [] );

	// Process comments to build the tree structure.
	const { resultComments, unresolvedSortedThreads } = useMemo( () => {
		const blocksWithComments = clientIds.reduce( ( results, clientId ) => {
			const commentId =
				getBlockAttributes( clientId )?.metadata?.commentId;
			if ( commentId ) {
				results[ clientId ] = commentId;
			}
			return results;
		}, {} );

		// Create a compare to store the references to all objects by id.
		const compare = {};
		const result = [];

		const allComments = threads ?? [];

		// Initialize each object with an empty `reply` array and map blockClientId.
		allComments.forEach( ( item ) => {
			const itemBlock = Object.keys( blocksWithComments ).find(
				( key ) => blocksWithComments[ key ] === item.id
			);

			compare[ item.id ] = {
				...item,
				reply: [],
				blockClientId: item.parent === 0 ? itemBlock : null,
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

		// Get comments by block order, first unresolved, then resolved.
		const unresolvedSortedComments = Object.values( blocksWithComments )
			.map( ( commentId ) => threadIdMap.get( String( commentId ) ) )
			.filter(
				( thread ) => thread !== undefined && thread.status === 'hold'
			);

		const resolvedSortedComments = Object.values( blocksWithComments )
			.map( ( commentId ) => threadIdMap.get( String( commentId ) ) )
			.filter(
				( thread ) =>
					thread !== undefined && thread.status === 'approved'
			);

		// Combine unresolved comments in block order with resolved comments at the end.
		const allSortedComments = [
			...unresolvedSortedComments,
			...resolvedSortedComments,
		];

		return {
			resultComments: allSortedComments,
			unresolvedSortedThreads: unresolvedSortedComments,
		};
	}, [ clientIds, threads, getBlockAttributes ] );

	return { resultComments, unresolvedSortedThreads, totalPages };
}

export function useBlockCommentsActions() {
	const { createNotice } = useDispatch( noticesStore );
	const { saveEntityRecord, deleteEntityRecord } = useDispatch( coreStore );
	const { getCurrentPostId } = useSelect( editorStore );
	const { getBlockAttributes, getSelectedBlockClientId } =
		useSelect( blockEditorStore );
	const { updateBlockAttributes } = useDispatch( blockEditorStore );

	const onError = ( error ) => {
		const errorMessage =
			error.message && error.code !== 'unknown_error'
				? decodeEntities( error.message )
				: __( 'An error occurred while performing an update.' );
		createNotice( 'error', errorMessage, {
			type: 'snackbar',
			isDismissible: true,
		} );
	};

	const onCreate = async ( { content, parent } ) => {
		try {
			const savedRecord = await saveEntityRecord(
				'root',
				'comment',
				{
					post: getCurrentPostId(),
					content,
					comment_type: 'block_comment',
					comment_approved: 0,
					parent: parent || 0,
				},
				{ throwOnError: true }
			);

			// If it's a main comment, update the block attributes with the comment id.
			if ( ! parent && savedRecord?.id ) {
				const clientId = getSelectedBlockClientId();
				const metadata = getBlockAttributes( clientId )?.metadata;
				updateBlockAttributes( clientId, {
					metadata: {
						...metadata,
						commentId: savedRecord.id,
					},
				} );
			}

			createNotice(
				'snackbar',
				parent
					? __( 'Reply added successfully.' )
					: __( 'Comment added successfully.' ),
				{
					type: 'snackbar',
					isDismissible: true,
				}
			);

			return savedRecord;
		} catch ( error ) {
			onError( error );
		}
	};

	const onEdit = async ( { id, content, status } ) => {
		const messageType = status ? status : 'updated';
		const messages = {
			approved: __( 'Comment marked as resolved.' ),
			hold: __( 'Comment reopened.' ),
			updated: __( 'Comment updated.' ),
		};

		try {
			await saveEntityRecord(
				'root',
				'comment',
				{
					id,
					content,
					status,
				},
				{ throwOnError: true }
			);
			createNotice(
				'snackbar',
				messages[ messageType ] ?? __( 'Comment updated.' ),
				{
					type: 'snackbar',
					isDismissible: true,
				}
			);
		} catch ( error ) {
			onError( error );
		}
	};

	const onDelete = async ( comment ) => {
		try {
			await deleteEntityRecord(
				'root',
				'comment',
				comment.id,
				undefined,
				{
					throwOnError: true,
				}
			);

			if ( ! comment.parent ) {
				const clientId = getSelectedBlockClientId();
				const metadata = getBlockAttributes( clientId )?.metadata;
				updateBlockAttributes( clientId, {
					metadata: {
						...metadata,
						commentId: undefined,
					},
				} );
			}

			createNotice( 'snackbar', __( 'Comment deleted successfully.' ), {
				type: 'snackbar',
				isDismissible: true,
			} );
		} catch ( error ) {
			onError( error );
		}
	};

	return { onCreate, onEdit, onDelete };
}

export function useEnableFloatingSidebar( enabled = false ) {
	const registry = useRegistry();
	useEffect( () => {
		if ( ! enabled ) {
			return;
		}

		return registry.subscribe( () => {
			const activeSidebar = registry
				.select( interfaceStore )
				.getActiveComplementaryArea( 'core' );

			if ( ! activeSidebar ) {
				registry
					.dispatch( interfaceStore )
					.enableComplementaryArea( 'core', collabSidebarName );
			}
		} );
	}, [ enabled, registry ] );
}
