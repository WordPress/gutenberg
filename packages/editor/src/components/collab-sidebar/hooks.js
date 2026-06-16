/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import {
	useState,
	useEffect,
	useMemo,
	useRef,
	useSyncExternalStore,
} from '@wordpress/element';
import { useEntityRecords, store as coreStore } from '@wordpress/core-data';
import { useDispatch, useRegistry, useSelect } from '@wordpress/data';
import {
	store as blockEditorStore,
	privateApis as blockEditorPrivateApis,
} from '@wordpress/block-editor';
import { store as noticesStore } from '@wordpress/notices';
import { getScrollContainer } from '@wordpress/dom';
import { decodeEntities } from '@wordpress/html-entities';
import { store as interfaceStore } from '@wordpress/interface';

/**
 * Internal dependencies
 */
import { store as editorStore } from '../../store';
import { FLOATING_NOTES_SIDEBAR } from './constants';
import { unlock } from '../../lock-unlock';
import { createBoardStore } from './board-store';
import { NOTE_FORMAT_NAME } from './format';
import {
	calculateNotePositions,
	findNoteRange,
	getNoteIdsFromMetadata,
	addNoteIdToMetadata,
	removeNoteIdFromMetadata,
} from './utils';
import {
	wrapInlineMarker,
	readInlineSelection,
	reconcileMarkerRemoval,
	useAnnotateRanges,
} from '../inline-markers';

const { cleanEmptyObject } = unlock( blockEditorPrivateApis );

// Sentinel that sorts a block-level (whole-block) note before any inline note
// within the same block. Negative so any real character offset (>= 0) ranks
// after it. Number.NEGATIVE_INFINITY would work too; -1 is enough and keeps
// the diff arithmetic in safe integers.
export const BLOCK_LEVEL_NOTE_START = -1;

/**
 * Resolve an inline note's character offset in its block so threads can be
 * sorted by reading order. Block-level notes (whose meta carries no inline
 * selection) sort first within their block via a sentinel.
 *
 * @param {Object}  thread     Materialized thread record (with `.id` and `.meta`).
 * @param {?Object} attributes Block attributes for the thread's block.
 * @return {number} Marker start offset, or `BLOCK_LEVEL_NOTE_START` when there is no inline anchor.
 */
export function getInlineMarkerStart( thread, attributes ) {
	const selection =
		thread?.meta?._wp_note_selection &&
		! Array.isArray( thread.meta._wp_note_selection )
			? thread.meta._wp_note_selection
			: null;
	const attributeKey = selection?.attributeKey;
	if ( ! attributeKey || ! attributes ) {
		return BLOCK_LEVEL_NOTE_START;
	}
	const range = findNoteRange( attributes[ attributeKey ], thread.id );
	if ( range ) {
		return range.start;
	}
	// Inline note whose marker has been stripped (e.g. by an undo). Fall back
	// to the stored offset, then to the block-level sentinel.
	if ( Number.isInteger( selection.start ) ) {
		return selection.start;
	}
	return BLOCK_LEVEL_NOTE_START;
}

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

		// Single pass over clientIds builds the forward map and reverse lookup
		// together. getNoteIdsFromMetadata returns numeric ids, matching the
		// types returned by the comments REST endpoint.
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
						? clientIdByNoteId.get( item.id ) ?? null
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

		// Orphans: root threads without a linked block. They only need to come last.
		const orphans = rootThreads.filter(
			( thread ) => ! thread.blockClientId
		);

		return {
			notes: [ ...unresolved, ...resolved, ...orphans ],
			unresolvedNotes: unresolved,
		};
	}, [ clientIds, threads, getBlockAttributes ] );

	return {
		notes,
		unresolvedNotes,
	};
}

/**
 * Wrap a rich-text range with a core/note marker. Returns a new
 * RichTextData ready to write back into block attributes, or null when the
 * incoming value isn't a rich-text instance (legacy/string attributes).
 *
 * @param {*}      value Existing block attribute value.
 * @param {number} id    New note id to embed as `data-id`.
 * @param {number} start Range start offset.
 * @param {number} end   Range end offset.
 * @return {?RichTextData} Wrapped value or null when the attribute isn't rich text.
 */
function wrapInlineNote( value, id, start, end ) {
	return wrapInlineMarker( value, {
		formatType: NOTE_FORMAT_NAME,
		attributes: { 'data-id': String( id ) },
		start,
		end,
	} );
}

export function useNoteActions() {
	const { createNotice } = useDispatch( noticesStore );
	const { saveEntityRecord, deleteEntityRecord } = useDispatch( coreStore );
	const { getCurrentPostId } = useSelect( editorStore );
	const {
		getBlockAttributes,
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
			// Capture inline selection *before* the async save: focus may shift
			// during the round-trip and the editor's stored selection can
			// collapse if the user clicks elsewhere.
			const inlineSelection = ! parent
				? readInlineSelection( getSelectionStart, getSelectionEnd )
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
					...( inlineSelection
						? {
								meta: {
									_wp_note_selection: {
										attributeKey:
											inlineSelection.attributeKey,
										start: inlineSelection.start,
										end: inlineSelection.end,
									},
								},
						  }
						: {} ),
				},
				{ throwOnError: true }
			);

			// If it's a top-level note, update the block attributes with the note id.
			// Read-modify-write on metadata is racy under concurrent edits:
			// two near-simultaneous adds against the same base will each write
			// a 2-element array and the later write wins, dropping the other
			// id. Tracking issue: https://github.com/WordPress/gutenberg/issues/74751.
			if ( ! parent && savedRecord?.id ) {
				const clientId =
					inlineSelection?.clientId || getSelectedBlockClientId();
				if ( ! clientId ) {
					return savedRecord;
				}
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

				await saveEntityRecord( 'root', 'comment', newNoteData, {
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

	const onDelete = async ( note ) => {
		try {
			await deleteEntityRecord( 'root', 'comment', note.id, undefined, {
				throwOnError: true,
			} );

			if ( ! note.parent ) {
				// Use blockClientId if available, otherwise fall back to selected block.
				const clientId =
					note.blockClientId || getSelectedBlockClientId();
				if ( ! clientId ) {
					return;
				}
				const metadata = getBlockAttributes( clientId )?.metadata;
				const updatedMetadata = removeNoteIdFromMetadata(
					metadata,
					note.id
				);
				updateBlockAttributes( clientId, {
					metadata: cleanEmptyObject( updatedMetadata ),
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

export function useFloatingBoard( {
	threads,
	selectedNoteId,
	isFloating,
	sidebarRef,
} ) {
	const [ notePositions, setNotePositions ] = useState( {} );
	const [ store ] = useState( createBoardStore );

	const heights = useSyncExternalStore( store.subscribe, store.getSnapshot );

	// Notes are positioned in canvas content-space; CSS inherits
	// `--canvas-scroll` to translate each thread in sync with the canvas.
	useEffect( () => {
		if ( ! isFloating || ! sidebarRef?.current ) {
			return;
		}

		const panel = sidebarRef.current;
		const blockEl = store.getFirstBlockElement();
		// Climb to the block-list root so nested scroll containers
		// (e.g. a Group with overflow:auto) don't shadow the canvas.
		const rootEl = blockEl?.closest( '.is-root-container' ) ?? blockEl;
		const canvas = rootEl ? getScrollContainer( rootEl ) : null;

		const applyScroll = () => {
			panel.style.setProperty(
				'--canvas-scroll',
				`${ -( canvas?.scrollTop ?? 0 ) }px`
			);
		};

		// Recalc is deferred to a rAF; back-to-back updates collapse into one paint.
		const rafId = window.requestAnimationFrame( () => {
			const result = calculateNotePositions( {
				threads,
				selectedNoteId,
				blockRects: store.getBlockRects(),
				heights,
				scrollTop: canvas?.scrollTop ?? 0,
			} );

			setNotePositions( result.positions );
			applyScroll();
		} );

		// Root scrolling elements (documentElement/body) don't fire scroll
		// on themselves; capture on the window catches them in either canvas.
		const view = canvas?.ownerDocument?.defaultView;
		const listenerOptions = { passive: true, capture: true };
		view?.addEventListener( 'scroll', applyScroll, listenerOptions );

		return () => {
			window.cancelAnimationFrame( rafId );
			view?.removeEventListener( 'scroll', applyScroll, listenerOptions );
		};
	}, [ sidebarRef, heights, isFloating, selectedNoteId, store, threads ] );

	return {
		notePositions,
		registerThread: store.registerThread,
		unregisterThread: store.unregisterThread,
	};
}

const NOTE_ANNOTATION_SOURCE = 'core-note';

/**
 * Decorate inline-note ranges using the annotations API. The preferred anchor
 * is the in-content `core/note` marker (resilient to edits); the comment
 * `_wp_note_selection` meta is the fallback for content without a marker.
 *
 * @param {Array} threads Note threads, including resolved status and meta.
 */
export function useAnnotateBlocks( threads ) {
	const { getBlockAttributes } = useSelect( blockEditorStore );

	const annotations = useMemo( () => {
		if ( ! threads?.length ) {
			return [];
		}
		const out = [];
		for ( const thread of threads ) {
			// Resolved threads shouldn't decorate; reopened threads still apply.
			if ( thread.status !== 'hold' || ! thread.blockClientId ) {
				continue;
			}
			const attributes = getBlockAttributes( thread.blockClientId );
			if ( ! attributes ) {
				continue;
			}
			// Meta is the fallback anchor and may be missing or returned as `[]`
			// when WordPress serializes an empty object meta.
			const selection =
				thread.meta?._wp_note_selection &&
				! Array.isArray( thread.meta._wp_note_selection )
					? thread.meta._wp_note_selection
					: null;
			const attributeKey = selection?.attributeKey;
			if ( ! attributeKey ) {
				continue;
			}
			// Prefer the in-content marker; fall back to stored offsets.
			const range =
				findNoteRange( attributes[ attributeKey ], thread.id ) ??
				( selection &&
				Number.isInteger( selection.start ) &&
				Number.isInteger( selection.end )
					? { start: selection.start, end: selection.end }
					: null );
			if ( ! range ) {
				continue;
			}
			out.push( {
				id: String( thread.id ),
				clientId: thread.blockClientId,
				attributeKey,
				start: range.start,
				end: range.end,
			} );
		}
		return out;
	}, [ threads, getBlockAttributes ] );

	useAnnotateRanges( NOTE_ANNOTATION_SOURCE, annotations );
}

/**
 * Decide what to do with an inline note based on whether its in-content marker
 * is still present. Pure so it can be unit-tested without React/stores.
 *
 * - `'anchor'`: the marker is present; record that we've seen it this session.
 * - `'delete'`: the marker was seen earlier this session but is now gone (the
 *   user removed the marked text), so the note should be deleted.
 * - `'skip'`: not an inline note, the block isn't loaded yet, or the marker is
 *   absent for a note we never saw anchored (e.g. a legacy/never-anchored note,
 *   which keeps its stored-offset fallback rather than being deleted).
 *
 * @param {Object}  thread     Materialized thread record (with `.id`, `.meta`, `.blockClientId`).
 * @param {?Object} attributes Block attributes for the thread's block, or null/undefined when unloaded.
 * @param {Set}     anchored   Ids whose marker has been observed present this session.
 * @return {'anchor'|'delete'|'skip'} The action to take.
 */
export function reconcileInlineNoteMarker( thread, attributes, anchored ) {
	const selection =
		thread?.meta?._wp_note_selection &&
		! Array.isArray( thread.meta._wp_note_selection )
			? thread.meta._wp_note_selection
			: null;
	if (
		! selection?.attributeKey ||
		! thread?.blockClientId ||
		! attributes
	) {
		return reconcileMarkerRemoval( null, thread?.id, anchored );
	}
	const present = !! findNoteRange(
		attributes[ selection.attributeKey ],
		thread.id
	);
	return reconcileMarkerRemoval( present, thread.id, anchored );
}

/**
 * Delete inline notes whose in-content marker the user has removed (e.g. by
 * backspacing the marked text) instead of letting them silently fall back to
 * block-level notes.
 *
 * A note is only deleted once its marker has been observed present earlier in
 * the same session, guarding against false deletes while content is still
 * loading or in the brief window after creation before the marker is written.
 *
 * @param {Array} threads Inline note threads (unresolved roots) to reconcile.
 */
export function useReconcileRemovedInlineNotes( threads ) {
	const { getBlockAttributes } = useSelect( blockEditorStore );
	const { onDelete } = useNoteActions();
	const anchoredRef = useRef();

	useEffect( () => {
		if ( ! threads?.length ) {
			return;
		}
		// Lazily seed the session set inside the effect; refs must not be
		// read or written during render.
		if ( ! anchoredRef.current ) {
			anchoredRef.current = new Set();
		}
		const anchored = anchoredRef.current;
		for ( const thread of threads ) {
			const action = reconcileInlineNoteMarker(
				thread,
				thread.blockClientId
					? getBlockAttributes( thread.blockClientId )
					: null,
				anchored
			);
			if ( action === 'anchor' ) {
				anchored.add( thread.id );
			} else if ( action === 'delete' ) {
				// Drop from the set first so a re-render before the delete
				// settles (the thread lingers until the entity refetches) does
				// not enqueue a second delete.
				anchored.delete( thread.id );
				onDelete( thread );
			}
		}
	}, [ threads, getBlockAttributes, onDelete ] );
}
