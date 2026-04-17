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
	useState,
	useEffect,
	useMemo,
	useSyncExternalStore,
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
import { FLOATING_NOTES_SIDEBAR } from './constants';
import { unlock } from '../../lock-unlock';
import { createBoardStore } from './board-store';
import { calculateAllOffsets } from './utils';

const { useBlockElement, cleanEmptyObject } = unlock( blockEditorPrivateApis );

export function useBlockComments( postId ) {
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
	};
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
			return savedRecord;
		} catch ( error ) {
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

		const { getActiveComplementaryArea } =
			registry.select( interfaceStore );
		const { disableComplementaryArea, enableComplementaryArea } =
			registry.dispatch( interfaceStore );

		const unsubscribe = registry.subscribe( () => {
			// Return `null` to indicate the user hid the complementary area.
			if ( getActiveComplementaryArea( 'core' ) === null ) {
				enableComplementaryArea( 'core', FLOATING_NOTES_SIDEBAR );
			}
		} );

		return () => {
			unsubscribe();
			if (
				getActiveComplementaryArea( 'core' ) === FLOATING_NOTES_SIDEBAR
			) {
				disableComplementaryArea( 'core', FLOATING_NOTES_SIDEBAR );
			}
		};
	}, [ enabled, registry ] );
}

export function useFloatingBoard( { threads, selectedNoteId, isFloating } ) {
	const [ boardOffsets, setBoardOffsets ] = useState( {} );
	const [ store ] = useState( createBoardStore );
	const { setCanvasMinHeight } = unlock( useDispatch( editorStore ) );

	const heights = useSyncExternalStore( store.subscribe, store.getSnapshot );

	// Recalc is deferred to a rAF; the cleanup cancels the pending frame
	// when deps change, so back-to-back updates collapse into one paint.
	useEffect( () => {
		if ( ! isFloating ) {
			return;
		}

		const rafId = window.requestAnimationFrame( () => {
			const { offsets, minHeight } = calculateAllOffsets( {
				threads,
				selectedNoteId,
				blockRects: store.getBlockRects(),
				heights,
			} );
			setBoardOffsets( offsets );
			setCanvasMinHeight( minHeight );
		} );

		return () => window.cancelAnimationFrame( rafId );
	}, [
		heights,
		isFloating,
		selectedNoteId,
		setCanvasMinHeight,
		store,
		threads,
	] );

	return {
		boardOffsets,
		registerThread: store.registerThread,
		unregisterThread: store.unregisterThread,
	};
}

export function useFloatingThread( {
	thread,
	calculatedOffset,
	registerThread,
	unregisterThread,
} ) {
	const blockElement = useBlockElement( thread.blockClientId );

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

	// Set the floating-ui reference element.
	useEffect( () => {
		if ( blockElement ) {
			refs.setReference( blockElement );
		}
	}, [ blockElement, refs ] );

	// Register block + floating elements with the board.
	// The board's ResizeObserver tracks height changes automatically.
	useEffect( () => {
		const floatingEl = refs.floating?.current;
		if ( floatingEl && registerThread ) {
			registerThread( thread.id, blockElement, floatingEl );
		}
		return () => unregisterThread?.( thread.id );
	}, [
		blockElement,
		thread.id,
		refs.floating,
		registerThread,
		unregisterThread,
	] );

	return {
		y,
		refs,
	};
}
