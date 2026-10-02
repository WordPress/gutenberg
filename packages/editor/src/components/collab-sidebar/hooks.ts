import { speak } from '@wordpress/a11y';
import { __ } from '@wordpress/i18n';
import {
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
// @ts-expect-error - No type declarations available for @wordpress/block-editor
// prettier-ignore
import { store as blockEditorStore, privateApis as blockEditorPrivateApis } from '@wordpress/block-editor';
import { store as noticesStore } from '@wordpress/notices';
import { decodeEntities } from '@wordpress/html-entities';
import { store as interfaceStore } from '@wordpress/interface';
import type { MutableRefObject } from 'react';
import { store as editorStore } from '../../store';
import { FLOATING_NOTES_SIDEBAR } from './constants';
import { unlock } from '../../lock-unlock';
import { createBoardStore } from './board-store';
import {
	calculateNotePositions,
	clearInlineNoteMarker,
	findNoteInBlock,
	addNoteIdToMetadata,
	focusNoteThread,
	getAttributeTextLength,
	getInlineMarkerStart,
	getNoteIdsFromMetadata,
	getThreadsForBlock,
	pickPrimaryNote,
	readInlineSelection,
	readMultiBlockSelection,
	removeNoteFormat,
	removeNoteIdFromMetadata,
	wrapInlineNote,
} from './utils';
import type { BlockAttributes, NoteSegment, Thread } from './utils';

const { cleanEmptyObject } = unlock( blockEditorPrivateApis );

export function useNoteThreads( postId: number | undefined ) {
	const queryArgs = {
		post: postId,
		type: 'note',
		status: 'all',
		per_page: -1,
	};

	const { records: threads } = useEntityRecords< Thread >(
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
		const blocksWithNotes: Record< string, number[] > = {};
		const clientIdsByNoteId = new Map< number | 'new', string[] >();
		for ( const clientId of clientIds ) {
			const metadata = getBlockAttributes( clientId )?.metadata;
			const noteIds = getNoteIdsFromMetadata( metadata );
			if ( noteIds.length > 0 ) {
				blocksWithNotes[ clientId ] = noteIds;
				for ( const noteId of noteIds ) {
					// A multi-block note lists its id in every block it spans.
					// clientIds are iterated in document order, so the first
					// entry is the anchor: the topmost block, which the floating
					// thread aligns to.
					const spanned = clientIdsByNoteId.get( noteId );
					if ( spanned ) {
						spanned.push( clientId );
					} else {
						clientIdsByNoteId.set( noteId, [ clientId ] );
					}
				}
			}
		}
		const anchorOf = ( noteId: number | 'new' ) =>
			clientIdsByNoteId.get( noteId )?.[ 0 ] ?? null;

		// Materialize threads; collect roots; replies linked in a second pass
		// via unshift to invert order (matches prior reverse semantics).
		const threadsById = new Map< number | 'new', Thread >();
		const rootThreads: Thread[] = [];
		for ( const item of threads ) {
			const thread: Thread = {
				...item,
				reply: [],
				blockClientId: item.parent === 0 ? anchorOf( item.id ) : null,
				// Every block the note spans, in document order. Single-block
				// notes get a one-entry array.
				blockClientIds:
					item.parent === 0
						? ( clientIdsByNoteId.get( item.id ) ?? [] )
						: [],
			};
			threadsById.set( item.id, thread );
			if ( item.parent === 0 ) {
				rootThreads.push( thread );
			}
		}
		for ( const item of threads ) {
			if ( ! item.parent ) {
				continue;
			}
			const child = threadsById.get( item.id );
			const parentThread = threadsById.get( item.parent );
			if ( child && parentThread ) {
				parentThread.reply?.unshift( child );
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
		const unresolved: Thread[] = [];
		const resolved: Thread[] = [];
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
					// A multi-block note is listed in several blocks' metadata;
					// emit it once, at its anchor (topmost) block, so it isn't
					// duplicated in the list.
					if ( anchorOf( noteId ) !== clientId ) {
						return null;
					}
					return {
						thread,
						start: getInlineMarkerStart( thread, attributes ),
					};
				} )
				.filter(
					( entry ): entry is { thread: Thread; start: number } =>
						entry !== null
				)
				.sort( ( a, b ) => {
					if ( a.start !== b.start ) {
						return a.start - b.start;
					}
					return (
						( a.thread.id as number ) - ( b.thread.id as number )
					);
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
	};
}

export function useNoteActions() {
	const registry = useRegistry();
	const { createNotice } = useDispatch( noticesStore );
	const { saveEntityRecord, deleteEntityRecord } = useDispatch( coreStore );
	const { getCurrentPostId } = useSelect( editorStore );
	const {
		getBlockAttributes,
		getClientIdsWithDescendants,
		getSelectedBlockClientId,
		getSelectedBlockClientIds,
		getSelectionStart,
		getSelectionEnd,
	} = useSelect( blockEditorStore );
	const { updateBlockAttributes } = useDispatch( blockEditorStore );

	const onError = ( error: unknown ) => {
		const { message, code } = ( error ?? {} ) as {
			message?: string;
			code?: string;
		};
		const errorMessage =
			message && code !== 'unknown_error'
				? decodeEntities( message )
				: __( 'An error occurred while performing an update.' );
		createNotice( 'error', errorMessage, {
			type: 'snackbar',
			isDismissible: true,
		} );
	};

	// Resolve the anchor for a new note as an ordered list of per-block segments:
	// a single-block inline selection, a cross-block text selection, or - failing
	// both - the selected block as a block-level anchor. Read *before* the async
	// save because focus (and the stored selection) can shift during the
	// round-trip; each text segment's marker is the note's only durable anchor.
	const readNoteSegments = (): NoteSegment[] => {
		const inline = readInlineSelection(
			getSelectionStart,
			getSelectionEnd
		);
		if ( inline ) {
			return [ inline ];
		}
		const multi = readMultiBlockSelection( {
			getSelectionStart,
			getSelectionEnd,
			getSelectedBlockClientIds,
			getBlockAttributes,
		} );
		if ( multi ) {
			return multi;
		}
		const clientId = getSelectedBlockClientId();
		return clientId
			? [ { clientId, attributeKey: null, start: null, end: null } ]
			: [];
	};

	const onCreate = async ( {
		content,
		parent,
	}: {
		content: string;
		parent?: number;
	} ) => {
		try {
			// Prefer segments captured at trigger time (multi-block notes,
			// whose cross-block selection collapses once the form is focused);
			// otherwise read the live selection (single-block inline / block-level).
			const captured = ! parent
				? unlock(
						registry.select( editorStore )
					).getPendingNoteSegments()
				: null;
			const segments: NoteSegment[] = ! parent
				? ( captured ?? readNoteSegments() )
				: [];

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
			 * Anchor a top-level note to every block it spans: add the id to
			 * each block's metadata and, where the segment covers text, wrap
			 * that text in a shared core/note marker. Read-modify-write on
			 * metadata is racy under concurrent edits: two near-simultaneous
			 * adds against the same base will each write a 2-element array and
			 * the later write wins, dropping the other id. Tracking issue:
			 * https://github.com/WordPress/gutenberg/issues/74751.
			 */
			if ( ! parent && savedRecord?.id ) {
				const attributesByClientId: Record< string, BlockAttributes > =
					{};
				for ( const segment of segments ) {
					const { clientId, attributeKey, start, end } = segment;
					if ( ! clientId ) {
						continue;
					}
					const attributes = getBlockAttributes( clientId );
					const newAttributes: BlockAttributes = {
						metadata: cleanEmptyObject(
							addNoteIdToMetadata(
								attributes?.metadata,
								savedRecord.id
							)
						),
					};

					// Text segments also carry the marker so the anchor survives
					// later edits; edge/interior blocks with no range stay
					// block-level (metadata only).
					if ( attributeKey && start !== null && end !== null ) {
						/*
						 * The offsets were captured before the save; the block
						 * may have been edited during the round-trip, so clamp
						 * them to the text as it stands now rather than writing
						 * format runs past its end.
						 */
						const value = attributes?.[ attributeKey ];
						const length = getAttributeTextLength( value );
						const safeStart = Math.min( start, length );
						const safeEnd = Math.min( end, length );
						const wrapped =
							safeEnd > safeStart
								? wrapInlineNote(
										value,
										savedRecord.id,
										safeStart,
										safeEnd
									)
								: null;
						if ( wrapped ) {
							newAttributes[ attributeKey ] = wrapped;
						}
					}

					attributesByClientId[ clientId ] = newAttributes;
				}

				/*
				 * One dispatch for every spanned block, so anchoring a
				 * multi-block note is a single undo step. Undoing it must not
				 * leave the note attached to some of its blocks.
				 */
				const clientIds = Object.keys( attributesByClientId );
				if ( clientIds.length > 0 ) {
					updateBlockAttributes( clientIds, attributesByClientId, {
						uniqueByBlock: true,
					} );
				}
			}

			// Consume the stashed segments so a later single-block or inline note
			// can't inherit this note's cross-block anchor. Only once the note is
			// anchored: a failed save leaves the form open for a retry, which still
			// needs the captured span the collapsed selection can no longer give.
			if ( ! parent && captured ) {
				unlock(
					registry.dispatch( editorStore )
				).setPendingNoteSegments( null );
			}

			createNotice(
				// @ts-expect-error The notices types don't cover the custom
				// 'snackbar' status used here.
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

	const onEdit = async ( {
		id,
		content,
		status,
	}: {
		id: number;
		content?: string;
		status?: string;
	} ) => {
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

			createNotice(
				// @ts-expect-error The notices types don't cover the custom
				// 'snackbar' status used here.
				'snackbar',
				__( 'Note updated.' ),
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

	const onDelete = async ( note: Thread ) => {
		// A saved note's id is always numeric; the 'new' placeholder never
		// reaches the delete path.
		const noteId = note.id as number;
		try {
			await deleteEntityRecord( 'root', 'comment', noteId, undefined, {
				throwOnError: true,
			} );

			// Strip the note's anchor from every block it spans: remove the id
			// from metadata and remove the inline marker (if any). A multi-block
			// note lives in several blocks, so scan them all rather than a single
			// anchor. Metadata and marker fold into one attribute update, and
			// every block into one dispatch, so removing the anchor is a single
			// undo step however many blocks the note covered.
			if ( ! note.parent ) {
				const attributesByClientId: Record< string, BlockAttributes > =
					{};
				for ( const clientId of getClientIdsWithDescendants() ) {
					const attributes = getBlockAttributes( clientId );
					const hasMetadataId = getNoteIdsFromMetadata(
						attributes?.metadata
					).includes( noteId );
					const found = findNoteInBlock( attributes, noteId );
					if ( ! hasMetadataId && ! found ) {
						continue;
					}
					const newAttributes: BlockAttributes = {};
					if ( hasMetadataId ) {
						newAttributes.metadata = cleanEmptyObject(
							removeNoteIdFromMetadata(
								attributes?.metadata,
								noteId
							)
						);
					}
					if ( found ) {
						const next = removeNoteFormat(
							attributes?.[ found.attributeKey ],
							noteId
						);
						if ( next ) {
							newAttributes[ found.attributeKey ] = next;
						}
					}
					attributesByClientId[ clientId ] = newAttributes;
				}
				const clientIds = Object.keys( attributesByClientId );
				if ( clientIds.length > 0 ) {
					updateBlockAttributes( clientIds, attributesByClientId, {
						uniqueByBlock: true,
					} );
				}
			}

			createNotice(
				// @ts-expect-error The notices types don't cover the custom
				// 'snackbar' status used here.
				'snackbar',
				__( 'Note deleted.' ),
				{
					type: 'snackbar',
					isDismissible: true,
				}
			);

			return true;
		} catch ( error ) {
			onError( error );
			return undefined;
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

		// Hiding the complementary area only changes the preferences store.
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

type BoardSnapshot = {
	heights: Record< string, number >;
	anchorRects: Record< string, { top: number } >;
	canvas: HTMLElement | null;
	frameOffset: number;
};

type BoardStore = {
	subscribe: ( listener: () => void ) => () => void;
	getSnapshot: () => BoardSnapshot;
	requestMeasure: () => void;
	registerThread: (
		id: number | string,
		blockEl: HTMLElement | null,
		floatingEl: HTMLElement | null
	) => void;
	unregisterThread: ( id: number | string ) => void;
};

/**
 * Keeps the selected note in step with the selected block, and focuses the
 * selected note's thread when the selection asks for it.
 *
 * @param {Object} props
 * @param {Array}  props.notes      Threads shown in the sidebar.
 * @param {Object} props.sidebarRef Ref to the sidebar element.
 */
export function useNoteSelection( {
	notes,
	sidebarRef,
}: {
	notes: Thread[];
	sidebarRef: MutableRefObject< HTMLElement | null >;
} ) {
	const registry = useRegistry();
	const { selectNote } = unlock( useDispatch( editorStore ) );
	// Selecting a note that spans several blocks multi-selects them, and
	// `getSelectedBlockClientId` is null for a multi-selection. Fall back to
	// the first block of the range so the note stays selected.
	const selectedBlockClientId: string | null = useSelect( ( select ) => {
		const { getSelectedBlockClientId, getMultiSelectedBlockClientIds } =
			select( blockEditorStore );
		return (
			getSelectedBlockClientId() ??
			getMultiSelectedBlockClientIds()[ 0 ] ??
			null
		);
	}, [] );
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
	const syncWithBlock = useEvent( ( clientId: string | null ) => {
		const { getSelectedNote, isNoteFocused } = unlock(
			registry.select( editorStore )
		);
		// A pending focus request is an explicit pick; leave it alone.
		if ( isNoteFocused() ) {
			return;
		}
		// Orphaned threads have no block either; don't match them.
		// A multi-block note belongs to every block it spans.
		const blockThreads = clientId
			? getThreadsForBlock( notes, clientId )
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
}: {
	threads: Thread[];
	selectedNoteId?: number | string;
	isFloating?: boolean;
	sidebarRef?: MutableRefObject< HTMLElement | null >;
} ) {
	// `board-store.js` is plain JavaScript with an `Object` return type.
	const [ store ] = useState( createBoardStore as () => BoardStore );

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
		view?.addEventListener( 'scroll', applyScroll, listenerOptions );
		return () => {
			view?.removeEventListener( 'scroll', applyScroll, listenerOptions );
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
		return () => {
			panel.style.removeProperty( '--canvas-offset' );
		};
	}, [ sidebarRef, isFloating, frameOffset ] );

	return {
		notePositions,
		registerThread: store.registerThread,
		unregisterThread: store.unregisterThread,
	};
}
