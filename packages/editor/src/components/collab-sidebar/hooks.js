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
import { getScrollContainer } from '@wordpress/dom';
import { decodeEntities } from '@wordpress/html-entities';
import { store as interfaceStore } from '@wordpress/interface';
import { RichTextData, create } from '@wordpress/rich-text';

/**
 * Internal dependencies
 */
import { store as editorStore } from '../../store';
import { FLOATING_NOTES_SIDEBAR } from './constants';
import { unlock } from '../../lock-unlock';
import { createBoardStore } from './board-store';
import { NOTE_FORMAT_NAME } from './format';
import {
	applyNoteFormat,
	calculateNotePositions,
	findNoteInBlock,
	getInlineMarkerStart,
	getNoteIdsFromMetadata,
	addNoteIdToMetadata,
	readMultiBlockSelection,
	removeNoteFormat,
	removeNoteIdFromMetadata,
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
					// First-wins: a multi-block note lists its id in every
					// block it spans; clientIds are iterated in document order,
					// so the anchor is the topmost block and the floating thread
					// aligns to the start of the range.
					if ( ! clientIdByNoteId.has( noteId ) ) {
						clientIdByNoteId.set( noteId, clientId );
					}
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
					// A multi-block note is listed in several blocks' metadata;
					// emit it once, at its anchor (topmost) block, so it isn't
					// duplicated in the list.
					if ( clientIdByNoteId.get( noteId ) !== clientId ) {
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
 * Read an inline selection from block-editor selection state, returning
 * normalized anchor data when a non-collapsed selection sits inside a single
 * rich-text attribute. Returns null for block-level or collapsed selections.
 *
 * @param {Function} getSelectionStart Block-editor selector.
 * @param {Function} getSelectionEnd   Block-editor selector.
 * @return {?Object} { clientId, attributeKey, start, end } or null.
 */
function readInlineSelection( getSelectionStart, getSelectionEnd ) {
	const start = getSelectionStart();
	const end = getSelectionEnd();
	if (
		! start?.clientId ||
		start.clientId !== end.clientId ||
		! start.attributeKey ||
		start.offset === undefined ||
		end.offset === undefined ||
		start.offset === end.offset
	) {
		return null;
	}
	// Normalize direction so callers don't have to think about reversed ranges.
	const [ startOffset, endOffset ] =
		start.offset < end.offset
			? [ start.offset, end.offset ]
			: [ end.offset, start.offset ];
	return {
		clientId: start.clientId,
		attributeKey: start.attributeKey,
		start: startOffset,
		end: endOffset,
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
	if ( ! ( value instanceof RichTextData ) ) {
		return null;
	}
	const record = applyNoteFormat(
		create( { html: value.toHTMLString() } ),
		{ type: NOTE_FORMAT_NAME, attributes: { 'data-id': String( id ) } },
		start,
		end
	);
	// Round-trip through HTML to normalise format references (applyNoteFormat
	// leaves them un-normalised) so the stored value matches a fresh reload.
	return RichTextData.fromHTMLString(
		new RichTextData( record ).toHTMLString()
	);
}

/**
 * Strip a note's inline `core/note` marker from every block that holds it, so a
 * deleted or resolved note's highlight does not linger in the content. A
 * multi-block note carries a marker in each block it spans, so this scans them
 * all. No-op for block-level notes (those carry no marker). Used by the resolve
 * path, which only knows the note id; the delete path strips markers inline.
 *
 * @param {number}   noteId                      Note id whose markers to remove.
 * @param {Function} getClientIdsWithDescendants Block-editor selector.
 * @param {Function} getBlockAttributes          Block-editor selector.
 * @param {Function} updateBlockAttributes       Block-editor action.
 */
function clearInlineNoteMarker(
	noteId,
	getClientIdsWithDescendants,
	getBlockAttributes,
	updateBlockAttributes
) {
	for ( const clientId of getClientIdsWithDescendants() ) {
		const attributes = getBlockAttributes( clientId );
		const found = findNoteInBlock( attributes, noteId );
		if ( ! found ) {
			continue;
		}
		const next = removeNoteFormat(
			attributes[ found.attributeKey ],
			noteId
		);
		if ( next ) {
			updateBlockAttributes( clientId, { [ found.attributeKey ]: next } );
		}
	}
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

	// Resolve the anchor for a new note as an ordered list of per-block segments:
	// a single-block inline selection, a cross-block text selection, or - failing
	// both - the selected block as a block-level anchor. Read *before* the async
	// save because focus (and the stored selection) can shift during the
	// round-trip; each text segment's marker is the note's only durable anchor.
	const readNoteSegments = () => {
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

	const onCreate = async ( { content, parent } ) => {
		try {
			// Prefer segments captured at trigger time (multi-block notes,
			// whose cross-block selection collapses once the form is focused);
			// otherwise read the live selection (single-block inline / block-level).
			const captured = ! parent
				? unlock(
						registry.select( editorStore )
				  ).getPendingNoteSegments()
				: null;
			const segments = ! parent ? captured ?? readNoteSegments() : [];
			// Consume the stashed segments so a later single-block or inline note
			// can't inherit this note's cross-block anchor.
			if ( ! parent && captured ) {
				unlock(
					registry.dispatch( editorStore )
				).setPendingNoteSegments( null );
			}

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

			// Anchor a top-level note to every block it spans: add the id to each
			// block's metadata and, where the segment covers text, wrap that text
			// in a shared core/note marker. Read-modify-write on metadata is racy
			// under concurrent edits (later write wins, dropping the other id):
			// https://github.com/WordPress/gutenberg/issues/74751.
			if ( ! parent && savedRecord?.id ) {
				for ( const segment of segments ) {
					const { clientId, attributeKey, start, end } = segment;
					if ( ! clientId ) {
						continue;
					}
					const attributes = getBlockAttributes( clientId );
					const newAttributes = {
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
					if ( attributeKey ) {
						const wrapped = wrapInlineNote(
							attributes?.[ attributeKey ],
							savedRecord.id,
							start,
							end
						);
						if ( wrapped ) {
							newAttributes[ attributeKey ] = wrapped;
						}
					}

					updateBlockAttributes( clientId, newAttributes );
				}
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

			// Strip the note's anchor from every block it spans: remove the id
			// from metadata and remove the inline marker (if any). A multi-block
			// note lives in several blocks, so scan them all rather than a single
			// anchor. Each block's metadata + marker fold into one attribute
			// update so it's a single undo step per block.
			if ( ! note.parent ) {
				for ( const clientId of getClientIdsWithDescendants() ) {
					const attributes = getBlockAttributes( clientId );
					const hasMetadataId = getNoteIdsFromMetadata(
						attributes?.metadata
					).includes( note.id );
					const found = findNoteInBlock( attributes, note.id );
					if ( ! hasMetadataId && ! found ) {
						continue;
					}
					const newAttributes = {};
					if ( hasMetadataId ) {
						newAttributes.metadata = cleanEmptyObject(
							removeNoteIdFromMetadata(
								attributes?.metadata,
								note.id
							)
						);
					}
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
