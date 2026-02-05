/**
 * External dependencies
 */
import {
	useFloating,
	offset as offsetMiddleware,
	autoUpdate,
} from '@floating-ui/react-dom';

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import {
	useEffect,
	useMemo,
	useCallback,
	useReducer,
} from '@wordpress/element';
import { useEntityRecords, store as coreStore } from '@wordpress/core-data';
import { useDispatch, useRegistry, useSelect } from '@wordpress/data';
import {
	store as blockEditorStore,
	privateApis as blockEditorPrivateApis,
} from '@wordpress/block-editor';
import { store as noticesStore } from '@wordpress/notices';
import { decodeEntities } from '@wordpress/html-entities';
import { store as interfaceStore } from '@wordpress/interface';

/**
 * Internal dependencies
 */
import { store as editorStore } from '../../store';
import { collabSidebarName } from './constants';
import { unlock } from '../../lock-unlock';
import { noop } from './utils';

const { useBlockElement, cleanEmptyObject } = unlock( blockEditorPrivateApis );

export function useBlockComments( postId ) {
	const [ commentLastUpdated, reflowComments ] = useReducer(
		() => Date.now(),
		0
	);

	const queryArgs = {
		post: postId,
		type: 'note',
		status: 'all',
		per_page: -1,
	};

	const { records: threads } = useEntityRecords(
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
		if ( ! threads || threads.length === 0 ) {
			return { resultComments: [], unresolvedSortedThreads: [] };
		}

		const blocksWithComments = clientIds.reduce( ( results, clientId ) => {
			const commentId = getBlockAttributes( clientId )?.metadata?.noteId;
			if ( commentId ) {
				results[ clientId ] = commentId;
			}
			return results;
		}, {} );

		// Create a compare to store the references to all objects by id.
		const compare = {};
		const result = [];

		// Create a reverse map for faster lookup.
		const commentIdToBlockClientId = Object.keys(
			blocksWithComments
		).reduce( ( mapping, clientId ) => {
			mapping[ blocksWithComments[ clientId ] ] = clientId;
			return mapping;
		}, {} );

		// Initialize each object with an empty `reply` array and map blockClientId.
		threads.forEach( ( item ) => {
			const itemBlock = commentIdToBlockClientId[ item.id ];

			compare[ item.id ] = {
				...item,
				reply: [],
				blockClientId: item.parent === 0 ? itemBlock : null,
			};
		} );

		// Iterate over the data to build the tree structure.
		threads.forEach( ( item ) => {
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

		// Prepare sets to determine which threads are linked to existing blocks.
		const mappedIds = new Set(
			Object.values( blocksWithComments ).map( ( id ) => String( id ) )
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

		// Append orphaned notes (whose related block was deleted or missing).
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
	}, [ clientIds, threads, getBlockAttributes ] );

	return {
		resultComments,
		unresolvedSortedThreads,
		reflowComments,
		commentLastUpdated,
	};
}

export function useBlockCommentsActions( reflowComments = noop ) {
	const registry = useRegistry();
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
					status: 'hold',
					type: 'note',
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
						noteId: savedRecord.id,
					},
				} );
			}

			createNotice(
				'snackbar',
				parent ? __( 'Reply added.' ) : __( 'Note added.' ),
				{
					type: 'snackbar',
					isDismissible: true,
				}
			);
			setTimeout( reflowComments, 300 );
			return savedRecord;
		} catch ( error ) {
			reflowComments();
			onError( error );
		}
	};

	const onEdit = async ( { id, content, status } ) => {
		const messageType = status ? status : 'updated';
		const messages = {
			approved: __( 'Note marked as resolved.' ),
			hold: __( 'Note reopened.' ),
			updated: __( 'Note updated.' ),
		};

		try {
			// For resolution or reopen actions, create a new note with metadata.
			if ( status === 'approved' || status === 'hold' ) {
				// First, update the thread status.
				await saveEntityRecord(
					'root',
					'comment',
					{
						id,
						status,
					},
					{
						throwOnError: true,
					}
				);

				// Then create a new comment with the metadata.
				const newCommentData = {
					post: getCurrentPostId(),
					content: content || '', // Empty content for resolve, content for reopen.
					type: 'note',
					status,
					parent: id,
					meta: {
						_wp_note_status:
							status === 'approved' ? 'resolved' : 'reopen',
					},
				};

				await saveEntityRecord( 'root', 'comment', newCommentData, {
					throwOnError: true,
				} );
			} else {
				const updateData = {
					id,
					content,
					status,
				};

				await saveEntityRecord( 'root', 'comment', updateData, {
					throwOnError: true,
				} );
			}

			createNotice(
				'snackbar',
				messages[ messageType ] ?? __( 'Note updated.' ),
				{
					type: 'snackbar',
					isDismissible: true,
				}
			);
			reflowComments();
		} catch ( error ) {
			reflowComments();
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
					metadata: cleanEmptyObject( {
						...metadata,
						noteId: undefined,
					} ),
				} );
			}

			createNotice( 'snackbar', __( 'Note deleted.' ), {
				type: 'snackbar',
				isDismissible: true,
			} );
			reflowComments();
		} catch ( error ) {
			reflowComments();
			onError( error );
		}
	};

	const onAddReaction = async ( { commentId, emoji } ) => {
		try {
			// Get current user from the store.
			const currentUser =
				registry.select( coreStore ).getCurrentUser() || {};
			const userId = currentUser.id;

			if ( ! userId ) {
				throw new Error(
					__( 'You must be logged in to add reactions.' )
				);
			}

			// Get current comment data.
			const comment = registry
				.select( coreStore )
				.getEntityRecord( 'root', 'comment', commentId );

			if ( ! comment ) {
				throw new Error( __( 'Comment not found.' ) );
			}

			// Get existing reactions or initialize empty object.
			const existingReactions = comment.meta?._wp_reactions || {};

			// Check if user already reacted with this emoji.
			const emojiReactions = existingReactions[ emoji ] || [];
			const alreadyReacted = emojiReactions.some(
				( reaction ) => reaction.userId === userId
			);

			if ( alreadyReacted ) {
				return;
			}

			// Add new reaction.
			const newReaction = {
				userId,
				timestamp: new Date().toISOString(),
			};

			const updatedReactions = {
				...existingReactions,
				[ emoji ]: [ ...emojiReactions, newReaction ],
			};

			await saveEntityRecord(
				'root',
				'comment',
				{
					id: commentId,
					meta: {
						_wp_reactions: updatedReactions,
					},
				},
				{ throwOnError: true }
			);

			createNotice( 'snackbar', __( 'Reaction added.' ), {
				type: 'snackbar',
				isDismissible: true,
			} );
			reflowComments();
		} catch ( error ) {
			reflowComments();
			onError( error );
		}
	};

	const onRemoveReaction = async ( { commentId, emoji } ) => {
		try {
			// Get current user from the store.
			const currentUser =
				registry.select( coreStore ).getCurrentUser() || {};
			const userId = currentUser.id;

			if ( ! userId ) {
				throw new Error(
					__( 'You must be logged in to remove reactions.' )
				);
			}

			// Get current comment data.
			const comment = registry
				.select( coreStore )
				.getEntityRecord( 'root', 'comment', commentId );

			if ( ! comment ) {
				throw new Error( __( 'Comment not found.' ) );
			}

			// Get existing reactions.
			const existingReactions = comment.meta?._wp_reactions || {};
			const emojiReactions = existingReactions[ emoji ] || [];

			// Filter out current user's reaction.
			const updatedEmojiReactions = emojiReactions.filter(
				( reaction ) => reaction.userId !== userId
			);

			// Build updated reactions object, removing empty arrays.
			const updatedReactions = { ...existingReactions };
			if ( updatedEmojiReactions.length > 0 ) {
				updatedReactions[ emoji ] = updatedEmojiReactions;
			} else {
				delete updatedReactions[ emoji ];
			}

			await saveEntityRecord(
				'root',
				'comment',
				{
					id: commentId,
					meta: {
						_wp_reactions:
							Object.keys( updatedReactions ).length > 0
								? updatedReactions
								: {},
					},
				},
				{ throwOnError: true }
			);

			createNotice( 'snackbar', __( 'Reaction removed.' ), {
				type: 'snackbar',
				isDismissible: true,
			} );
			reflowComments();
		} catch ( error ) {
			reflowComments();
			onError( error );
		}
	};

	const onToggleReaction = async ( { commentId, emoji } ) => {
		try {
			// Get current user from the store.
			const currentUser =
				registry.select( coreStore ).getCurrentUser() || {};
			const userId = currentUser.id;

			if ( ! userId ) {
				throw new Error( __( 'You must be logged in to react.' ) );
			}

			// Get current comment data.
			const comment = registry
				.select( coreStore )
				.getEntityRecord( 'root', 'comment', commentId );

			if ( ! comment ) {
				throw new Error( __( 'Comment not found.' ) );
			}

			// Check if user already reacted with this emoji.
			const existingReactions = comment.meta?._wp_reactions || {};
			const emojiReactions = existingReactions[ emoji ] || [];
			const alreadyReacted = emojiReactions.some(
				( reaction ) => reaction.userId === userId
			);

			if ( alreadyReacted ) {
				await onRemoveReaction( { commentId, emoji } );
			} else {
				await onAddReaction( { commentId, emoji } );
			}
		} catch ( error ) {
			reflowComments();
			onError( error );
		}
	};

	return {
		onCreate,
		onEdit,
		onDelete,
		onAddReaction,
		onRemoveReaction,
		onToggleReaction,
	};
}

export function useEnableFloatingSidebar( enabled = false ) {
	const registry = useRegistry();
	useEffect( () => {
		if ( ! enabled ) {
			return;
		}

		const { getActiveComplementaryArea } =
			registry.select( interfaceStore );
		const { disableComplementaryArea, enableComplementaryArea } =
			registry.dispatch( interfaceStore );

		const unsubscribe = registry.subscribe( () => {
			// Return `null` to indicate the user hid the complementary area.
			if ( getActiveComplementaryArea( 'core' ) === null ) {
				enableComplementaryArea( 'core', collabSidebarName );
			}
		} );

		return () => {
			unsubscribe();
			if ( getActiveComplementaryArea( 'core' ) === collabSidebarName ) {
				disableComplementaryArea( 'core', collabSidebarName );
			}
		};
	}, [ enabled, registry ] );
}

export function useFloatingThread( {
	thread,
	calculatedOffset,
	setHeights,
	selectedThread,
	setBlockRef,
	commentLastUpdated,
} ) {
	const blockElement = useBlockElement( thread.blockClientId );
	const updateHeight = useCallback(
		( id, newHeight ) => {
			setHeights( ( prev ) => {
				if ( prev[ id ] !== newHeight ) {
					return { ...prev, [ id ]: newHeight };
				}
				return prev;
			} );
		},
		[ setHeights ]
	);

	// Use floating-ui to track the block element's position with the calculated offset.
	const { y, refs } = useFloating( {
		placement: 'right-start',
		middleware: [
			offsetMiddleware( {
				crossAxis: calculatedOffset || -16,
			} ),
		],
		whileElementsMounted: autoUpdate,
	} );

	// Store the block reference for each thread.
	useEffect( () => {
		if ( blockElement ) {
			refs.setReference( blockElement );
		}
	}, [ blockElement, refs, commentLastUpdated ] );

	// Track thread heights.
	useEffect( () => {
		if ( refs.floating?.current ) {
			setBlockRef( thread.id, blockElement );
		}
	}, [ blockElement, thread.id, refs.floating, setBlockRef ] );

	// When the selected thread changes, update heights, triggering offset recalculation.
	useEffect( () => {
		if ( refs.floating?.current ) {
			const newHeight = refs.floating.current.scrollHeight;
			updateHeight( thread.id, newHeight );
		}
	}, [
		thread.id,
		updateHeight,
		refs.floating,
		selectedThread,
		commentLastUpdated,
	] );

	return {
		y,
		refs,
	};
}
