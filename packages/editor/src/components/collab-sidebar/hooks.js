import { speak } from '@wordpress/a11y';
import { __ } from '@wordpress/i18n';
import {
	useCallback,
	useState,
	useEffect,
	useLayoutEffect,
	useMemo,
	useRef,
	useSyncExternalStore,
} from '@wordpress/element';
import { useEvent } from '@wordpress/compose';
import { useEntityRecords, store as coreStore } from '@wordpress/core-data';
import { useDispatch, useRegistry, useSelect } from '@wordpress/data';
import {
	store as blockEditorStore,
	privateApis as blockEditorPrivateApis,
} from '@wordpress/block-editor';
import { store as noticesStore } from '@wordpress/notices';
import apiFetch from '@wordpress/api-fetch';
import { addQueryArgs } from '@wordpress/url';
import { decodeEntities } from '@wordpress/html-entities';
import { store as interfaceStore } from '@wordpress/interface';
import { store as editorStore } from '../../store';
import { FLOATING_NOTES_SIDEBAR } from './constants';
import { unlock } from '../../lock-unlock';
import { createBoardStore } from './board-store';
import {
	calculateNotePositions,
	clearInlineNoteMarker,
	findNoteInBlock,
	focusNoteThread,
	getInlineMarkerStart,
	getNoteIdsFromMetadata,
	addNoteIdToMetadata,
	pickPrimaryNote,
	readInlineSelection,
	removeNoteFormat,
	removeNoteIdFromMetadata,
	wrapInlineNote,
} from './utils';

const { cleanEmptyObject } = unlock( blockEditorPrivateApis );

export function useNoteThreads( postId ) {
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

	// Build reactionsMap from the reaction_summary field on each note.
	// Shape: { [noteId]: { [emojiSlug]: { count, reacted, my_reaction_id } } }
	const reactionsMap = useMemo( () => {
		if ( ! threads || threads.length === 0 ) {
			return {};
		}

		const map = {};
		threads.forEach( ( thread ) => {
			if ( thread.reaction_summary ) {
				map[ thread.id ] = thread.reaction_summary;
			}
		} );
		return map;
	}, [ threads ] );

	const { getBlockAttributes } = useSelect( blockEditorStore );
	const { clientIds } = useSelect( ( select ) => {
		const { getClientIdsWithDescendants } = select( blockEditorStore );
		return {
			clientIds: getClientIdsWithDescendants(),
		};
	}, [] );

	// Process notes to build the tree structure.
	const { notes, unresolvedNotes } = useMemo( () => {
		if ( ! threads || threads.length === 0 ) {
			return { notes: [], unresolvedNotes: [] };
		}

		/*
		 * Single pass over clientIds builds the forward map and reverse lookup
		 * together. getNoteIdsFromMetadata returns numeric ids, matching the
		 * types returned by the comments REST endpoint.
		 */
		const blocksWithNotes = {};
		const clientIdByNoteId = new Map();
		for ( const clientId of clientIds ) {
			const metadata = getBlockAttributes( clientId )?.metadata;
			const noteIds = getNoteIdsFromMetadata( metadata );
			if ( noteIds.length > 0 ) {
				blocksWithNotes[ clientId ] = noteIds;
				for ( const noteId of noteIds ) {
					clientIdByNoteId.set( noteId, clientId );
				}
			}
		}

		// Materialize threads; collect roots; replies linked in a second pass
		// via unshift to invert order (matches prior reverse semantics).
		const threadsById = new Map();
		const rootThreads = [];
		for ( const item of threads ) {
			const thread = {
				...item,
				reply: [],
				blockClientId:
					item.parent === 0
						? ( clientIdByNoteId.get( item.id ) ?? null )
						: null,
			};
			threadsById.set( item.id, thread );
			if ( item.parent === 0 ) {
				rootThreads.push( thread );
			}
		}
		for ( const item of threads ) {
			if ( item.parent !== 0 ) {
				threadsById
					.get( item.parent )
					?.reply.unshift( threadsById.get( item.id ) );
			}
		}

		if ( rootThreads.length === 0 ) {
			return { notes: [], unresolvedNotes: [] };
		}

		// Order within a block: block-level notes (no inline anchor) come
		// first as the "overall comment", then inline notes ascending by
		// marker start offset. Ties (rare; two markers at the same offset)
		// fall back to creation order via thread id. Blocks themselves are
		// already iterated in document order above.
		const unresolved = [];
		const resolved = [];
		for ( const [ clientId, noteIds ] of Object.entries(
			blocksWithNotes
		) ) {
			const attributes = getBlockAttributes( clientId );
			const orderedThreads = noteIds
				.map( ( noteId ) => {
					const thread = threadsById.get( noteId );
					if ( ! thread ) {
						return null;
					}
					return {
						thread,
						start: getInlineMarkerStart( thread, attributes ),
					};
				} )
				.filter( Boolean )
				.sort( ( a, b ) => {
					if ( a.start !== b.start ) {
						return a.start - b.start;
					}
					return a.thread.id - b.thread.id;
				} );
			for ( const { thread } of orderedThreads ) {
				if ( thread.status === 'hold' ) {
					unresolved.push( thread );
				} else if ( thread.status === 'approved' ) {
					resolved.push( thread );
				}
			}
		}

		// Orphans: root threads without a linked block. They stay with the
		// active notes (above the "Resolved" separator) since they may still
		// need attention even though their associated block is gone.
		const orphans = rootThreads.filter(
			( thread ) => ! thread.blockClientId
		);

		return {
			notes: [ ...unresolved, ...orphans, ...resolved ],
			unresolvedNotes: unresolved,
		};
	}, [ clientIds, threads, getBlockAttributes ] );

	return {
		notes,
		unresolvedNotes,
		reactionsMap,
	};
}

/**
 * Folds a completed reaction toggle into a cached note record.
 *
 * Used to keep `reaction_summary` usable when the refetch that would
 * normally replace it fails: without it, the next toggle reads a stale
 * `reacted` / `my_reaction_id` pair and takes the wrong branch.
 *
 * @param {Object} note              The cached note record.
 * @param {string} emoji             The reaction storage slug that changed.
 * @param {number} [addedReactionId] The new reaction's comment ID when one was
 *                                   added; omitted when one was removed.
 * @return {Object} The note with an updated `reaction_summary`.
 */
function applyReactionDelta( note, emoji, addedReactionId ) {
	const summary = { ...( note.reaction_summary || {} ) };
	const entry = summary[ emoji ];

	if ( addedReactionId ) {
		summary[ emoji ] = {
			count: ( entry?.count || 0 ) + 1,
			reacted: true,
			my_reaction_id: addedReactionId,
		};
	} else if ( entry ) {
		const count = entry.count - 1;
		if ( count > 0 ) {
			summary[ emoji ] = { count, reacted: false };
		} else {
			delete summary[ emoji ];
		}
	}

	return { ...note, reaction_summary: summary };
}

/*
 * Per-note count of landed reaction mutations. Each toggle refetches the
 * whole `reaction_summary`, so a refresh issued before a later mutation
 * landed would overwrite that mutation's result; the counter lets it tell.
 * Module-level so every `useNoteActions` instance shares it.
 */
const reactionMutationCounts = new Map();

export function useNoteActions( reactionsMap = {} ) {
	const { createNotice } = useDispatch( noticesStore );
	const { saveEntityRecord, deleteEntityRecord, receiveEntityRecords } =
		useDispatch( coreStore );
	const { getEntityRecord } = useSelect( coreStore );
	const { getCurrentPostId } = useSelect( editorStore );
	const {
		getBlockAttributes,
		getClientIdsWithDescendants,
		getSelectedBlockClientId,
		getSelectionStart,
		getSelectionEnd,
	} = useSelect( blockEditorStore );
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
			// Capture the target block and inline selection *before* the async
			// save: selection may shift during the round-trip, attaching the
			// note to the wrong block or collapsing its inline anchor.
			const inlineSelection = ! parent
				? readInlineSelection( getSelectionStart, getSelectionEnd )
				: null;
			const clientId = ! parent
				? inlineSelection?.clientId || getSelectedBlockClientId()
				: null;

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

			/*
			 * If it's a top-level note, update the block attributes with the
			 * note id. Read-modify-write on metadata is racy under concurrent
			 * edits: two near-simultaneous adds against the same base will each
			 * write a 2-element array and the later write wins, dropping the
			 * other id. Tracking issue:
			 * https://github.com/WordPress/gutenberg/issues/74751.
			 */
			if ( ! parent && savedRecord?.id && clientId ) {
				const attributes = getBlockAttributes( clientId );
				const metadata = attributes?.metadata;
				const updatedMetadata = addNoteIdToMetadata(
					metadata,
					savedRecord.id
				);
				const newAttributes = {
					metadata: cleanEmptyObject( updatedMetadata ),
				};

				// Inline path: also wrap the selected text with a core/note
				// marker so the anchor survives later edits.
				if ( inlineSelection ) {
					const wrapped = wrapInlineNote(
						attributes?.[ inlineSelection.attributeKey ],
						savedRecord.id,
						inlineSelection.start,
						inlineSelection.end
					);
					if ( wrapped ) {
						newAttributes[ inlineSelection.attributeKey ] = wrapped;
					}
				}

				updateBlockAttributes( clientId, newAttributes );
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

				// Then create a new note with the metadata.
				const newNoteData = {
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

				const savedRecord = await saveEntityRecord(
					'root',
					'comment',
					newNoteData,
					{
						throwOnError: true,
					}
				);

				// Resolving a note drops its inline highlight: strip the marker
				// so the note falls back to a block-level note in the content.
				if ( status === 'approved' ) {
					clearInlineNoteMarker(
						id,
						getClientIdsWithDescendants,
						getBlockAttributes,
						updateBlockAttributes
					);
				}

				// The note visibly updates in place, so there is no snackbar,
				// but screen reader users still need the confirmation.
				speak(
					status === 'approved'
						? __( 'Note marked as resolved.' )
						: __( 'Note reopened.' )
				);

				return savedRecord;
			}

			const updateData = {
				id,
				content,
				status,
			};

			const savedRecord = await saveEntityRecord(
				'root',
				'comment',
				updateData,
				{
					throwOnError: true,
				}
			);

			createNotice( 'snackbar', __( 'Note updated.' ), {
				type: 'snackbar',
				isDismissible: true,
			} );

			return savedRecord;
		} catch ( error ) {
			onError( error );
		}
	};

	const onDelete = async ( note ) => {
		try {
			// Capture the target block *before* the async delete: selection may
			// shift during the round-trip, pointing the attribute cleanup at the
			// wrong block.
			const clientId = ! note.parent
				? note.blockClientId || getSelectedBlockClientId()
				: null;

			await deleteEntityRecord( 'root', 'comment', note.id, undefined, {
				throwOnError: true,
			} );

			if ( clientId ) {
				const attributes = getBlockAttributes( clientId );
				const newAttributes = {
					metadata: cleanEmptyObject(
						removeNoteIdFromMetadata(
							attributes?.metadata,
							note.id
						)
					),
				};
				// Strip the inline marker too (if any) so the deleted note's
				// highlight doesn't linger in the content. Folded into the same
				// attribute update so it's a single undo step.
				const found = findNoteInBlock( attributes, note.id );
				if ( found ) {
					const next = removeNoteFormat(
						attributes[ found.attributeKey ],
						note.id
					);
					if ( next ) {
						newAttributes[ found.attributeKey ] = next;
					}
				}
				updateBlockAttributes( clientId, newAttributes );
			}

			createNotice( 'snackbar', __( 'Note deleted.' ), {
				type: 'snackbar',
				isDismissible: true,
			} );

			return true;
		} catch ( error ) {
			onError( error );
		}
	};

	const onToggleReaction = useCallback(
		async ( { commentId, emoji } ) => {
			// Check if the user already reacted via reaction_summary.
			const noteReactions = reactionsMap[ commentId ] || {};
			const emojiData = noteReactions[ emoji ];
			const isRemoving = !! (
				emojiData?.reacted && emojiData?.my_reaction_id
			);
			let addedReactionId;

			try {
				if ( isRemoving ) {
					// Force-delete the reaction comment rather than
					// trashing it (the WP REST default). Reactions
					// don't have a trash workflow, and a trashed
					// reaction would otherwise linger in `wp_comments`
					// indefinitely each time the user toggles it off.
					await deleteEntityRecord(
						'root',
						'comment',
						emojiData.my_reaction_id,
						{ force: true },
						{ throwOnError: true }
					);
				} else {
					// Add a new reaction as a comment record.
					const saved = await saveEntityRecord(
						'root',
						'comment',
						{
							post: getCurrentPostId(),
							type: 'reaction',
							parent: commentId,
							content: emoji,
							status: 'approve',
						},
						{ throwOnError: true }
					);
					addedReactionId = saved?.id;
				}
			} catch ( error ) {
				onError( error );
				return;
			}

			// `reaction_summary` is computed server-side and cached on the
			// parent note's entity record. Mutating a reaction comment
			// doesn't invalidate that field, so a subsequent toggle would
			// read stale `reacted` / `my_reaction_id` data and route into
			// the wrong branch (deleting an already-removed comment).
			//
			// The mutation has landed, so fold its known effect into the
			// cached record first. That keeps the next toggle correct even
			// if the refetch below never succeeds.
			const mutationCount =
				( reactionMutationCounts.get( commentId ) ?? 0 ) + 1;
			reactionMutationCounts.set( commentId, mutationCount );

			const cached = getEntityRecord( 'root', 'comment', commentId );
			if ( cached ) {
				receiveEntityRecords( 'root', 'comment', [
					applyReactionDelta(
						cached,
						emoji,
						isRemoving ? undefined : addedReactionId
					),
				] );
			}

			// Then refetch the parent note (1 record) for the authoritative
			// summary, which also picks up other users' reactions.
			// `receiveEntityRecords` with no `query` arg updates the
			// per-record cache, which the list selector reads through by ID
			// — so the LIST view picks up the fresh `reaction_summary`
			// without re-fetching every other note on the post. Only the
			// summary is requested and merged, so the view-context response
			// can't replace the cached edit-context fields like
			// `content.raw`, which seeds the edit form.
			try {
				const refreshed = await apiFetch( {
					path: addQueryArgs( `/wp/v2/comments/${ commentId }`, {
						_fields: 'id,reaction_summary',
					} ),
				} );
				// A newer mutation landed after this snapshot was requested;
				// its own refresh will carry the authoritative summary.
				if (
					reactionMutationCounts.get( commentId ) !== mutationCount
				) {
					return;
				}
				const latest = getEntityRecord( 'root', 'comment', commentId );
				if ( latest ) {
					receiveEntityRecords( 'root', 'comment', [
						{
							...latest,
							reaction_summary: refreshed.reaction_summary,
						},
					] );
				}
			} catch {
				// The toggle itself succeeded and the local delta above
				// already keeps this note's reactions consistent, so there
				// is nothing to report; the next load reconciles the rest.
			}
		},
		[
			reactionsMap,
			deleteEntityRecord,
			saveEntityRecord,
			getCurrentPostId,
			getEntityRecord,
			receiveEntityRecords,
		]
	);

	return {
		onCreate,
		onEdit,
		onDelete,
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
				enableComplementaryArea( 'core', FLOATING_NOTES_SIDEBAR );
			}
		} );

		return () => {
			unsubscribe();
			if (
				getActiveComplementaryArea( 'core' ) === FLOATING_NOTES_SIDEBAR
			) {
				disableComplementaryArea( 'core' );
			}
		};
	}, [ enabled, registry ] );
}

/**
 * Keeps the selected note in step with the selected block, and focuses the
 * selected note's thread when the selection asks for it.
 *
 * @param {Object} props
 * @param {Array}  props.notes      Threads shown in the sidebar.
 * @param {Object} props.sidebarRef Ref to the sidebar element.
 */
export function useNoteSelection( { notes, sidebarRef } ) {
	const registry = useRegistry();
	const { selectNote } = unlock( useDispatch( editorStore ) );
	const selectedBlockClientId = useSelect(
		( select ) => select( blockEditorStore ).getSelectedBlockClientId(),
		[]
	);
	const { selectedNote, noteFocused } = useSelect( ( select ) => {
		const { getSelectedNote, isNoteFocused } = unlock(
			select( editorStore )
		);
		return {
			selectedNote: getSelectedNote(),
			noteFocused: isNoteFocused(),
		};
	}, [] );

	// Select the block's primary note, or clear the selection if it has none.
	const syncWithBlock = useEvent( ( clientId ) => {
		const { getSelectedNote, isNoteFocused } = unlock(
			registry.select( editorStore )
		);
		// A pending focus request is an explicit pick; leave it alone.
		if ( isNoteFocused() ) {
			return;
		}
		// Orphaned threads have no block either; don't match them.
		const blockThreads = clientId
			? notes.filter( ( thread ) => thread.blockClientId === clientId )
			: [];
		// Selecting a thread also selects its block; keep the picked thread.
		const currentNoteId = getSelectedNote();
		if ( blockThreads.some( ( thread ) => thread.id === currentNoteId ) ) {
			return;
		}
		selectNote( pickPrimaryNote( blockThreads )?.id );
	} );

	// Sync only on block transitions, so in-block changes (Escape, Cancel,
	// the new note form) are left alone.
	const prevBlockIdRef = useRef( selectedBlockClientId );
	useEffect( () => {
		if ( prevBlockIdRef.current === selectedBlockClientId ) {
			return;
		}
		prevBlockIdRef.current = selectedBlockClientId;
		syncWithBlock( selectedBlockClientId );
	}, [ selectedBlockClientId, syncWithBlock ] );

	// Must run after the sync above, which reads the focus flag this clears.
	useEffect( () => {
		if ( ! noteFocused || ! selectedNote ) {
			return;
		}
		focusNoteThread(
			selectedNote,
			sidebarRef.current,
			selectedNote === 'new' ? '[role="textbox"]' : undefined
		);
		// Re-select without the flag so the focus happens once.
		selectNote( selectedNote );
	}, [ noteFocused, selectedNote, selectNote, sidebarRef ] );
}

const subscribeNoop = () => () => {};

export function useFloatingBoard( {
	threads,
	selectedNoteId,
	isFloating,
	sidebarRef,
} ) {
	const [ store ] = useState( createBoardStore );

	// Only floating mode needs measurements; without a subscriber the store
	// drops its observer.
	const { heights, anchorRects, canvas, frameOffset } = useSyncExternalStore(
		isFloating ? store.subscribe : subscribeNoop,
		store.getSnapshot
	);

	// Moving blocks shifts anchors without resizing anything or re-registering.
	useLayoutEffect( () => {
		store.requestMeasure();
	}, [ store, threads ] );

	// Derived during render, so a resize reaches the screen in the same paint.
	const notePositions = useMemo(
		() =>
			calculateNotePositions( {
				threads,
				selectedNoteId,
				blockRects: anchorRects,
				heights,
			} ).positions,
		[ threads, selectedNoteId, anchorRects, heights ]
	);

	// Notes are positioned in canvas content-space; CSS inherits
	// `--canvas-scroll` to translate each thread in sync with the canvas,
	// so scrolling never re-renders. A layout effect, so the offset is in
	// place before the first positions paint.
	useLayoutEffect( () => {
		const panel = sidebarRef?.current;
		if ( ! isFloating || ! panel || ! canvas ) {
			return;
		}

		const applyScroll = () => {
			panel.style.setProperty(
				'--canvas-scroll',
				`${ -canvas.scrollTop }px`
			);
		};
		applyScroll();

		// Root scrolling elements (documentElement/body) don't fire scroll
		// on themselves; capture on the window catches them in either canvas.
		const view = canvas.ownerDocument.defaultView;
		const listenerOptions = { passive: true, capture: true };
		view.addEventListener( 'scroll', applyScroll, listenerOptions );
		return () => {
			view.removeEventListener( 'scroll', applyScroll, listenerOptions );
			panel.style.removeProperty( '--canvas-scroll' );
		};
	}, [ sidebarRef, isFloating, canvas ] );

	// Shifts the threads by the canvas frame's offset from the panel.
	useLayoutEffect( () => {
		const panel = sidebarRef?.current;
		if ( ! isFloating || ! panel ) {
			return;
		}
		panel.style.setProperty( '--canvas-offset', `${ frameOffset }px` );
		return () => panel.style.removeProperty( '--canvas-offset' );
	}, [ sidebarRef, isFloating, frameOffset ] );

	return {
		notePositions,
		registerThread: store.registerThread,
		unregisterThread: store.unregisterThread,
	};
}
