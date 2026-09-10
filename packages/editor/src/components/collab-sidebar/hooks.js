import { speak } from '@wordpress/a11y';
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
import { RichTextData, create } from '@wordpress/rich-text';
import { store as editorStore } from '../../store';
import { FLOATING_NOTES_SIDEBAR } from './constants';
import { unlock } from '../../lock-unlock';
import { createBoardStore } from './board-store';
import { NOTE_FORMAT_NAME } from './format';
import {
	getTrashedNotes,
	setTrashedNoteState,
	subscribeTrashedNotes,
	trackTrashedNote,
} from './trashed-notes';
import {
	applyNoteFormat,
	calculateNotePositions,
	findNoteInBlock,
	getInlineMarkerStart,
	getNoteIdsFromMetadata,
	addNoteIdToMetadata,
	removeNoteFormat,
	removeNoteIdFromMetadata,
} from './utils';

const { cleanEmptyObject } = unlock( blockEditorPrivateApis );

/**
 * Notice id for the snackbar a note's deletion puts up.
 *
 * Stable per note so the snackbar can be taken down again once the note is
 * restored, whichever way the restore happened.
 *
 * @param {number} noteId Deleted note id.
 * @return {string} Notice id.
 */
function getDeleteNoticeId( noteId ) {
	return `editor-note-deleted-${ noteId }`;
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
 * Strip a note's inline `core/note` marker from whichever block holds it, if
 * any, so a deleted or resolved note's highlight does not linger in the content.
 * No-op for block-level notes (those carry no marker). Used by the resolve path,
 * which only knows the note id; the delete path strips the marker inline since
 * it already has the block.
 *
 * @param {number}   noteId                      Note id whose marker to remove.
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
		return;
	}
}

export function useNoteActions() {
	const { createNotice } = useDispatch( noticesStore );
	const { saveEntityRecord, deleteEntityRecord } = useDispatch( coreStore );
	const { getCurrentPostId } = useSelect( editorStore );
	const {
		getBlockAttributes,
		getClientIdsWithDescendants,
		getSelectedBlockClientId,
		getSelectionStart,
		getSelectionEnd,
	} = useSelect( blockEditorStore );
	const {
		updateBlockAttributes,
		__unstableMarkNextChangeAsNotPersistent,
		__unstableMarkLastChangeAsPersistent,
	} = useDispatch( blockEditorStore );
	const { undo } = useDispatch( editorStore );

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

			/*
			 * Deleting without `force` moves the comment to the trash, which
			 * keeps the record recoverable for the snackbar's Undo action.
			 * Trashed notes are purged later along with other trashed
			 * comments. Sites with the trash disabled (EMPTY_TRASH_DAYS = 0)
			 * reject the trash request; fall back to permanent deletion
			 * there, without offering Undo.
			 */
			let isTrashed = true;
			try {
				await deleteEntityRecord(
					'root',
					'comment',
					note.id,
					undefined,
					{
						throwOnError: true,
					}
				);
			} catch ( error ) {
				if ( error?.code !== 'rest_trash_not_supported' ) {
					throw error;
				}
				isTrashed = false;
				await deleteEntityRecord(
					'root',
					'comment',
					note.id,
					{ force: true },
					{ throwOnError: true }
				);
			}

			/*
			 * Whether the block still carries the note's id. True before the
			 * cleanup below, and true again once undo puts the id back.
			 */
			const isAttached = () =>
				!! clientId &&
				getNoteIdsFromMetadata(
					getBlockAttributes( clientId )?.metadata
				).includes( note.id );

			/*
			 * Whether the delete leaves an undo level behind. It only does
			 * when the note was actually attached to a block: replies and
			 * orphaned notes have no footprint in the content, so there's
			 * nothing for the editor's undo to restore.
			 */
			const isUndoable = isTrashed && isAttached();

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
				// highlight doesn't linger in the content.
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
				if ( isUndoable ) {
					/*
					 * Land the cleanup as its own undo level so undo restores
					 * the note id and its inline marker; `useNoteTrashSync`
					 * then follows the metadata back out of the trash. Closing
					 * the previous level first keeps the strip from merging
					 * into an in-progress typing session.
					 */
					__unstableMarkLastChangeAsPersistent();
				} else {
					/*
					 * Nothing to restore, either because the note was purged
					 * outright (the site has the trash disabled) or because it
					 * wasn't attached here. Keep the change out of history
					 * rather than let undo resurrect a marker for a note
					 * that's gone.
					 */
					__unstableMarkNextChangeAsNotPersistent( {
						history: 'ignore',
					} );
				}
				updateBlockAttributes( clientId, newAttributes );
			}

			if ( isUndoable ) {
				trackTrashedNote( note.id, clientId );
			}

			/*
			 * Restore path for trashed notes that left no undo level: with no
			 * block metadata to put back, untrashing the comment is the whole
			 * job.
			 */
			const restoreNote = async () => {
				try {
					// `untrash` restores the comment's pre-trash status.
					await saveEntityRecord(
						'root',
						'comment',
						{ id: note.id, status: 'untrash' },
						{ throwOnError: true }
					);
					createNotice( 'snackbar', __( 'Note restored.' ), {
						type: 'snackbar',
						isDismissible: true,
					} );
				} catch ( error ) {
					onError( error );
				}
			};

			/*
			 * Route undoable deletes through the editor's undo so the button
			 * and the undo shortcut are the same action, and redo re-deletes.
			 * The snackbar outlives a restore made from the toolbar or the
			 * keyboard, so check the note is still gone first: undoing a
			 * second time would take an unrelated change off the stack.
			 */
			const undoDelete = () => {
				if ( ! isAttached() ) {
					undo();
				}
			};

			createNotice( 'snackbar', __( 'Note deleted.' ), {
				id: getDeleteNoticeId( note.id ),
				type: 'snackbar',
				isDismissible: true,
				...( isTrashed && {
					actions: [
						{
							label: __( 'Undo' ),
							onClick: isUndoable ? undoDelete : restoreNote,
						},
					],
				} ),
			} );

			return true;
		} catch ( error ) {
			onError( error );
		}
	};

	return { onCreate, onEdit, onDelete };
}

/**
 * Keeps a trashed note's comment in step with its block metadata.
 *
 * Deleting a note strips its id from the block as an ordinary undo level, so
 * undo restores the id on its own and the comment has to follow it out of the
 * trash - and back in again on redo. Mount this once, above the notes panel,
 * so it keeps working while the panel is closed.
 */
export function useNoteTrashSync() {
	const trackedNotes = useSyncExternalStore(
		subscribeTrashedNotes,
		getTrashedNotes,
		getTrashedNotes
	);
	const { createNotice, removeNotice } = useDispatch( noticesStore );
	const { saveEntityRecord, deleteEntityRecord } = useDispatch( coreStore );
	// Requests in flight, so a re-render mid-round-trip doesn't fire a second.
	const pending = useRef( new Set() );

	/*
	 * Whether each tracked note is still referenced by its block, positionally
	 * matched to `trackedNotes`. `null` means the block itself is gone: the
	 * note is an orphan now, and orphans stay in the sidebar rather than being
	 * trashed behind the user's back.
	 */
	const isReferenced = useSelect(
		( select ) => {
			const { getBlockAttributes } = select( blockEditorStore );
			return trackedNotes.map( ( { noteId, clientId } ) => {
				const attributes = getBlockAttributes( clientId );
				if ( ! attributes ) {
					return null;
				}
				return getNoteIdsFromMetadata( attributes.metadata ).includes(
					noteId
				);
			} );
		},
		[ trackedNotes ]
	);

	useEffect( () => {
		trackedNotes.forEach( async ( { noteId, isTrashed }, index ) => {
			const referenced = isReferenced[ index ];
			if (
				referenced === null ||
				referenced === ! isTrashed ||
				pending.current.has( noteId )
			) {
				return;
			}
			pending.current.add( noteId );
			try {
				if ( referenced ) {
					/*
					 * The note is on its way back, so retire the snackbar that
					 * offered to bring it back. Dismissed before the request
					 * rather than after it so the stale Undo can't be clicked
					 * during the round-trip.
					 */
					removeNotice( getDeleteNoticeId( noteId ) );
					// `untrash` restores the comment's pre-trash status.
					await saveEntityRecord(
						'root',
						'comment',
						{ id: noteId, status: 'untrash' },
						{ throwOnError: true }
					);
					createNotice( 'snackbar', __( 'Note restored.' ), {
						type: 'snackbar',
						isDismissible: true,
					} );
				} else {
					await deleteEntityRecord(
						'root',
						'comment',
						noteId,
						undefined,
						{ throwOnError: true }
					);
				}
				setTrashedNoteState( noteId, ! referenced );
			} catch ( error ) {
				/*
				 * Leave the tracked state alone so the next block change
				 * retries; the note and its marker are briefly out of step
				 * until then.
				 */
				createNotice(
					'error',
					error.message && error.code !== 'unknown_error'
						? decodeEntities( error.message )
						: __( 'An error occurred while performing an update.' ),
					{ type: 'snackbar', isDismissible: true }
				);
			} finally {
				pending.current.delete( noteId );
			}
		} );
	}, [
		trackedNotes,
		isReferenced,
		saveEntityRecord,
		deleteEntityRecord,
		createNotice,
		removeNotice,
	] );
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
		let rafId;
		const schedule = () => {
			window.cancelAnimationFrame( rafId );
			rafId = window.requestAnimationFrame( () => {
				const result = calculateNotePositions( {
					threads,
					selectedNoteId,
					blockRects: store.getAnchorRects(),
					heights,
					scrollTop: canvas?.scrollTop ?? 0,
				} );

				setNotePositions( result.positions );
				applyScroll();
			} );
		};

		schedule();

		// Anchors are read from the DOM, so editing, adding or removing any
		// block leaves the threads after it stale.
		const contentObserver = new window.ResizeObserver( schedule );
		if ( rootEl ) {
			contentObserver.observe( rootEl );
		}

		// Root scrolling elements (documentElement/body) don't fire scroll
		// on themselves; capture on the window catches them in either canvas.
		const view = canvas?.ownerDocument?.defaultView;
		const listenerOptions = { passive: true, capture: true };
		view?.addEventListener( 'scroll', applyScroll, listenerOptions );

		return () => {
			window.cancelAnimationFrame( rafId );
			contentObserver.disconnect();
			view?.removeEventListener( 'scroll', applyScroll, listenerOptions );
		};
	}, [ sidebarRef, heights, isFloating, selectedNoteId, store, threads ] );

	return {
		notePositions,
		registerThread: store.registerThread,
		unregisterThread: store.unregisterThread,
	};
}
