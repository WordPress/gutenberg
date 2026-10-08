import { speak } from '@wordpress/a11y';
import { __ } from '@wordpress/i18n';
import {
	createContext,
	useContext,
	useState,
	useEffect,
	useLayoutEffect,
	useMemo,
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
import { decodeEntities } from '@wordpress/html-entities';
import { store as editorStore } from '../../store';
import { unlock } from '../../lock-unlock';
import { createBoardStore } from './board-store';
import {
	calculateNotePositions,
	findNoteInBlock,
	focusNoteThread,
	getAttributeByKey,
	getInlineMarkerStart,
	getNoteIdsFromMetadata,
	addNoteIdToMetadata,
	getNoteAtCaret,
	getRichTextText,
	pickNoteForCaret,
	readInlineSelection,
	removeInlineNote,
	removeNoteIdFromMetadata,
	setAttributeByKey,
	wrapInlineNote,
} from './utils';

const { cleanEmptyObject } = unlock( blockEditorPrivateApis );

/**
 * Unsent note drafts, keyed by block client ID for new notes and note ID for replies.
 */
export const NoteDraftsContext = createContext();

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
	};
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
	const {
		updateBlockAttributes,
		__unstableMarkNextChangeAsNotPersistent,
		__unstableMarkLastChangeAsPersistent,
	} = useDispatch( blockEditorStore );

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

	/*
	 * Update a note's anchor without an undo step, since undo can't bring the
	 * note back with it. The last call flags the post as changed, so "Save
	 * draft" turns on.
	 */
	const updateNoteAnchor = ( clientId, attributes ) => {
		__unstableMarkNextChangeAsNotPersistent( { history: 'ignore' } );
		updateBlockAttributes( clientId, attributes );
		__unstableMarkLastChangeAsPersistent();
	};

	const removeNoteMarker = ( clientId, noteId ) => {
		const attributes = getBlockAttributes( clientId );
		const removed = removeInlineNote( attributes, noteId );
		if ( removed ) {
			updateNoteAnchor(
				clientId,
				setAttributeByKey(
					attributes,
					removed.attributeKey,
					removed.value
				)
			);
		}
	};

	// The draft marker (id `new`) wraps the text an unsent note is about, so
	// the anchor follows edits until the note is sent.
	const onDiscard = ( clientId ) => removeNoteMarker( clientId, 'new' );

	// Starting again from another selection moves the marker; a collapsed
	// selection keeps it.
	const onStart = ( clientId ) => {
		const selection = readInlineSelection(
			getSelectionStart,
			getSelectionEnd
		);
		if ( selection?.clientId !== clientId ) {
			return;
		}
		onDiscard( clientId );
		const attributes = getBlockAttributes( clientId );
		const wrapped = wrapInlineNote(
			getAttributeByKey( attributes, selection.attributeKey ),
			'new',
			selection.start,
			selection.end
		);
		if ( wrapped ) {
			updateNoteAnchor(
				clientId,
				setAttributeByKey( attributes, selection.attributeKey, wrapped )
			);
		}
	};

	const onCreate = async ( { content, parent } ) => {
		try {
			// Capture the target block *before* the async save: selection may
			// shift during the round-trip, attaching the note to the wrong block.
			const clientId = ! parent ? getSelectedBlockClientId() : null;

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

				// Inline path: the draft marker becomes the note's marker.
				const draft = removeInlineNote( attributes, 'new' );
				if ( draft ) {
					Object.assign(
						newAttributes,
						setAttributeByKey(
							attributes,
							draft.attributeKey,
							wrapInlineNote(
								draft.value,
								savedRecord.id,
								draft.start,
								draft.end
							)
						)
					);
				}

				updateNoteAnchor( clientId, newAttributes );
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

	const onEdit = async ( note, { content, status } ) => {
		const { id } = note;
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
				if ( status === 'approved' && note.blockClientId ) {
					removeNoteMarker( note.blockClientId, id );
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

	const restoreNote = async ( noteId, anchor ) => {
		try {
			// Untrash first, so a failure doesn't leave an anchor without a note.
			await saveEntityRecord(
				'root',
				'comment',
				{ id: noteId, status: 'untrash' },
				{ throwOnError: true }
			);

			// No anchor (a reply or an orphan), or its block is gone: the
			// note comes back on its own.
			const attributes = anchor
				? getBlockAttributes( anchor.clientId )
				: null;
			if ( attributes ) {
				const newAttributes = {};
				// The editor's undo may have brought the anchor back already.
				if (
					! getNoteIdsFromMetadata( attributes.metadata ).includes(
						noteId
					)
				) {
					newAttributes.metadata = addNoteIdToMetadata(
						attributes.metadata,
						noteId
					);
				}
				const { inline } = anchor;
				const value =
					inline &&
					getAttributeByKey( attributes, inline.attributeKey );
				// Re-wrap only text that hasn't changed since the delete;
				// otherwise the note comes back as a block-level note.
				if (
					inline &&
					! findNoteInBlock( attributes, noteId ) &&
					getRichTextText( value )?.slice(
						inline.start,
						inline.end
					) === inline.text
				) {
					const wrapped = wrapInlineNote(
						value,
						noteId,
						inline.start,
						inline.end
					);
					if ( wrapped ) {
						Object.assign(
							newAttributes,
							setAttributeByKey(
								attributes,
								inline.attributeKey,
								wrapped
							)
						);
					}
				}
				if ( Object.keys( newAttributes ).length > 0 ) {
					updateNoteAnchor( anchor.clientId, newAttributes );
				}
			}

			createNotice( 'snackbar', __( 'Note restored.' ), {
				type: 'snackbar',
				isDismissible: true,
			} );
		} catch ( error ) {
			onError( error );
		}
	};

	const onDelete = async ( note ) => {
		try {
			// Capture the target block *before* the async delete: selection may
			// shift during the round-trip, pointing the attribute cleanup at the
			// wrong block.
			const clientId = ! note.parent ? note.blockClientId : null;

			// Without the trash, the note can only be deleted permanently,
			// and there's nothing for Undo to bring back.
			const canMoveToTrash = !! note._links?.[ 'wp:action-trash' ];
			await deleteEntityRecord(
				'root',
				'comment',
				note.id,
				canMoveToTrash ? undefined : { force: true },
				{ throwOnError: true }
			);

			// What Undo needs to re-attach the note to its block.
			let anchor = null;
			const attributes = clientId ? getBlockAttributes( clientId ) : null;
			if (
				getNoteIdsFromMetadata( attributes?.metadata ).includes(
					note.id
				)
			) {
				anchor = { clientId };
				const newAttributes = {
					metadata: cleanEmptyObject(
						removeNoteIdFromMetadata( attributes.metadata, note.id )
					),
				};
				// Strip the inline marker too (if any) so the deleted note's
				// highlight doesn't linger in the content.
				const removed = removeInlineNote( attributes, note.id );
				if ( removed ) {
					const { attributeKey, start, end, value } = removed;
					Object.assign(
						newAttributes,
						setAttributeByKey( attributes, attributeKey, value )
					);
					anchor.inline = {
						attributeKey,
						start,
						end,
						text: getRichTextText( value ).slice( start, end ),
					};
				}
				updateNoteAnchor( clientId, newAttributes );
			}

			createNotice( 'snackbar', __( 'Note deleted.' ), {
				type: 'snackbar',
				isDismissible: true,
				actions: canMoveToTrash
					? [
							{
								label: __( 'Undo' ),
								onClick: () => restoreNote( note.id, anchor ),
							},
						]
					: [],
			} );

			return true;
		} catch ( error ) {
			onError( error );
		}
	};

	return { onStart, onDiscard, onCreate, onEdit, onDelete };
}

/**
 * Keeps a note form's unsent content, so it survives the form unmounting.
 *
 * @param {string|number} key The block client ID for a new note, or the note ID for a reply.
 * @return {Object} The draft stored when the form mounted, its setter, and a check for a stored draft.
 */
export function useNoteDraft( key ) {
	const drafts = useContext( NoteDraftsContext );
	const [ initialValue ] = useState( () => drafts.get( key ) ?? '' );
	const setDraft = ( content ) => {
		if ( content ) {
			drafts.set( key, content );
		} else {
			drafts.delete( key );
		}
	};
	const hasDraft = () => drafts.has( key );
	return { initialValue, setDraft, hasDraft };
}

/**
 * Calls back when the caret moves. Skips typing: a selection change batched
 * with a content change moves the caret with the text, never across a marker.
 * A store subscription, not `useSelect`: nothing renders from it.
 *
 * @param {(caret: Object) => void} onChange Receives `{ clientId, previousClientId, isBlockChange, attributes, noteAtCaret }`.
 */
function useCaretChange( onChange ) {
	const registry = useRegistry();
	const handleChange = useEvent( onChange );
	useEffect( () => {
		const {
			getBlockAttributes,
			getSelectedBlockClientId,
			getSelectionStart,
			getSelectionEnd,
		} = registry.select( blockEditorStore );
		let clientId = getSelectedBlockClientId();
		let attributes = getBlockAttributes( clientId );
		let selectionStart = getSelectionStart();
		let selectionEnd = getSelectionEnd();
		return registry.subscribe( () => {
			const previousClientId = clientId;
			const previousAttributes = attributes;
			clientId = getSelectedBlockClientId();
			attributes = getBlockAttributes( clientId );
			if (
				getSelectionStart() === selectionStart &&
				getSelectionEnd() === selectionEnd
			) {
				return;
			}
			selectionStart = getSelectionStart();
			selectionEnd = getSelectionEnd();
			if (
				clientId === previousClientId &&
				attributes !== previousAttributes
			) {
				return;
			}
			handleChange( {
				clientId,
				previousClientId,
				isBlockChange: clientId !== previousClientId,
				attributes,
				noteAtCaret: getNoteAtCaret(
					attributes,
					selectionStart,
					selectionEnd
				),
			} );
		}, blockEditorStore );
	}, [ registry, handleChange ] );
}

/**
 * Syncs the selected note with the caret; see "Note selection" in the README.
 *
 * @param {Object}                     props
 * @param {Array}                      props.notes     Threads shown in the sidebar.
 * @param {Map}                        props.drafts    Unsent note drafts, see `NoteDraftsContext`.
 * @param {(clientId: string) => void} props.onDiscard Drops a block's draft marker.
 */
export function useNoteSelection( { notes, drafts, onDiscard } ) {
	const { getSelectedNote } = unlock( useSelect( editorStore ) );
	const { selectNote } = unlock( useDispatch( editorStore ) );

	useCaretChange( ( caret ) => {
		const selectedNoteId = getSelectedNote();
		const noteId = pickNoteForCaret( {
			...caret,
			// Without a block, `null` would match orphaned threads.
			blockThreads: caret.clientId
				? notes.filter(
						( thread ) => thread.blockClientId === caret.clientId
					)
				: [],
			hasDraft: drafts.has( caret.clientId ),
			selectedNoteId,
		} );

		// Leaving an empty new note form strips its draft marker.
		const isLeavingForm =
			selectedNoteId === 'new' &&
			( caret.isBlockChange || noteId !== 'new' );
		if ( isLeavingForm && ! drafts.has( caret.previousClientId ) ) {
			onDiscard( caret.previousClientId );
		}

		if ( noteId !== selectedNoteId ) {
			selectNote( noteId );
		}
	} );
}

/**
 * Selects a note from an explicit action. Selects its block first, so the
 * caret events for the block change run before the note is set.
 *
 * @param {Object}                     props
 * @param {Map}                        props.drafts    Unsent note drafts, see `NoteDraftsContext`.
 * @param {(clientId: string) => void} props.onDiscard Drops a block's draft marker.
 *
 * @return {(noteId: number|string, clientId: ?string, options?: Object) => void} Picks a note, see `selectNote` for the options.
 */
export function usePickNote( { drafts, onDiscard } ) {
	const { getSelectedBlockClientId } = useSelect( blockEditorStore );
	const { getSelectedNote } = unlock( useSelect( editorStore ) );
	const { selectBlock, toggleBlockSpotlight } = unlock(
		useDispatch( blockEditorStore )
	);
	const { selectNote } = unlock( useDispatch( editorStore ) );
	return ( noteId, clientId, options ) => {
		if ( clientId ) {
			// `null`: don't move focus to the block.
			selectBlock( clientId, null );
			toggleBlockSpotlight( clientId, true );
		}

		// No caret event strips the marker here, and the form unmounts before its focus-out runs.
		const formClientId = getSelectedBlockClientId();
		if (
			getSelectedNote() === 'new' &&
			noteId !== 'new' &&
			! drafts.has( formClientId )
		) {
			onDiscard( formClientId );
		}
		selectNote( noteId, options );
	};
}

/**
 * Focuses the selected note's thread when the selection asks for it. Lives
 * with the threads' DOM: the sidebar ref is only set once they render.
 *
 * @param {Object} props
 * @param {Object} props.sidebarRef Ref to the sidebar element.
 */
export function useNoteFocus( { sidebarRef } ) {
	const { selectNote } = unlock( useDispatch( editorStore ) );
	const { selectedNote, noteFocused } = useSelect( ( select ) => {
		const { getSelectedNote, isNoteFocused } = unlock(
			select( editorStore )
		);
		return {
			selectedNote: getSelectedNote(),
			noteFocused: isNoteFocused(),
		};
	}, [] );

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

/**
 * Extends the canvas past the lowest thread, or a short post can't scroll it
 * into view. The canvas margin's CSS applies the property as the root's
 * `min-height` (see `getCanvasMarginCSS`), so the room goes away with the
 * margin. Keyed on the canvas, since a new document starts without it.
 *
 * @param {Object}       props
 * @param {?HTMLElement} props.canvas        Canvas scroll container.
 * @param {number}       props.contentHeight Content height that fits every thread.
 * @param {boolean}      props.isFloating    Whether the notes float over the canvas.
 */
function useCanvasRoom( { canvas, contentHeight, isFloating } ) {
	useLayoutEffect( () => {
		if ( ! isFloating || ! canvas || ! contentHeight ) {
			return;
		}
		// On the root element, where the margin's rule reads it, whichever
		// element scrolls.
		const root = canvas.ownerDocument.documentElement;
		root.style.setProperty(
			'--wp-editor-canvas-min-height',
			`${ contentHeight }px`
		);
		return () => {
			root.style.removeProperty( '--wp-editor-canvas-min-height' );
		};
	}, [ isFloating, canvas, contentHeight ] );
}

/**
 * Mirrors the floating panel's scroll position with the canvas's. The panel
 * is a real scroller with the canvas's scroll range, and notes are positioned
 * in canvas content-space, so the panel's own scroll moves them with the
 * canvas, and wheel, keys, focus and `scrollIntoView()` all work natively.
 *
 * @param {Object}       props
 * @param {Object}       props.sidebarRef Ref to the floating panel.
 * @param {?HTMLElement} props.canvas     Canvas scroll container.
 * @param {boolean}      props.isFloating Whether the notes float over the canvas.
 */
function useMirroredScroll( { sidebarRef, canvas, isFloating } ) {
	useLayoutEffect( () => {
		const panel = sidebarRef?.current;
		if ( ! isFloating || ! panel || ! canvas ) {
			return;
		}

		const isNear = ( a, b ) => Math.abs( a - b ) < 1;

		let range;
		const syncRange = () => {
			const next = canvas.scrollHeight - canvas.clientHeight;
			if ( next !== range ) {
				range = next;
				panel.style.setProperty(
					'--canvas-scroll-range',
					`${ next }px`
				);
			}
		};

		// A programmatic scroll fires its own `scroll` event a frame later,
		// by which time the other side may have scrolled on (the compositor
		// scrolls ahead of the main thread). Each side remembers where it was
		// scrolled to and ignores that echo, or it would drag the other side
		// back on every frame.
		let panelEcho = -1;
		let canvasEcho = -1;

		// `instant` overrides a theme's `scroll-behavior: smooth`, which
		// would animate every sync.
		const scrollPanelTo = ( top ) => {
			panel.scrollTo( { top, behavior: 'instant' } );
			panelEcho = panel.scrollTop;
		};
		const fromCanvas = () => {
			const top = canvas.scrollTop;
			const isEcho = isNear( top, canvasEcho );
			canvasEcho = -1;
			if ( ! isEcho && ! isNear( panel.scrollTop, top ) ) {
				scrollPanelTo( top );
			}
		};
		// The canvas owns the position: when it can't follow (its room for
		// a newly expanded thread isn't there yet), the panel snaps back.
		const fromPanel = () => {
			const top = panel.scrollTop;
			const isEcho = isNear( top, panelEcho );
			panelEcho = -1;
			if ( isEcho || isNear( canvas.scrollTop, top ) ) {
				return;
			}
			canvas.scrollTo( { top, behavior: 'instant' } );
			canvasEcho = canvas.scrollTop;
			if ( ! isNear( canvasEcho, top ) ) {
				scrollPanelTo( canvasEcho );
			}
		};
		syncRange();
		fromCanvas();

		// Range only: a clamped scroller fires its own scroll event, and
		// syncing positions here would undo a panel scroll whose event is
		// still pending. The body is observed too, since a theme's
		// `html { height: 100% }` keeps the root box fixed as content grows.
		const { body, defaultView: view } = canvas.ownerDocument;
		const resizeObserver = new window.ResizeObserver( syncRange );
		resizeObserver.observe( canvas );
		resizeObserver.observe( body );
		resizeObserver.observe( panel );

		// Root scrolling elements (documentElement/body) don't fire scroll
		// on themselves; capture on the window catches them in either canvas.
		// Scrollable blocks fire there too, and are skipped.
		const onCanvasScroll = ( event ) => {
			if (
				event.target === canvas ||
				event.target === canvas.ownerDocument
			) {
				fromCanvas();
			}
		};
		const listenerOptions = { passive: true, capture: true };
		view.addEventListener( 'scroll', onCanvasScroll, listenerOptions );
		panel.addEventListener( 'scroll', fromPanel, { passive: true } );
		return () => {
			resizeObserver.disconnect();
			view.removeEventListener(
				'scroll',
				onCanvasScroll,
				listenerOptions
			);
			panel.removeEventListener( 'scroll', fromPanel );
			panel.style.removeProperty( '--canvas-scroll-range' );
		};
	}, [ sidebarRef, isFloating, canvas ] );
}

/**
 * Offsets the threads by the canvas frame and its scrollbar.
 *
 * @param {Object}  props
 * @param {Object}  props.sidebarRef     Ref to the floating panel.
 * @param {number}  props.frameOffset    Canvas frame top, relative to the panel.
 * @param {number}  props.scrollbarWidth Width of the canvas scrollbar.
 * @param {boolean} props.isFloating     Whether the notes float over the canvas.
 */
function usePanelOffsets( {
	sidebarRef,
	frameOffset,
	scrollbarWidth,
	isFloating,
} ) {
	useLayoutEffect( () => {
		const panel = sidebarRef?.current;
		if ( ! isFloating || ! panel ) {
			return;
		}
		panel.style.setProperty( '--canvas-offset', `${ frameOffset }px` );
		panel.style.setProperty(
			'--canvas-scrollbar-width',
			`${ scrollbarWidth }px`
		);
		return () => {
			panel.style.removeProperty( '--canvas-offset' );
			panel.style.removeProperty( '--canvas-scrollbar-width' );
		};
	}, [ sidebarRef, isFloating, frameOffset, scrollbarWidth ] );
}

export function useFloatingBoard( {
	threads,
	selectedNoteId,
	isFloating,
	sidebarRef,
} ) {
	const [ store ] = useState( createBoardStore );

	// Only floating mode needs measurements; without a subscriber the store
	// drops its observer.
	const { heights, anchorRects, canvas, frameOffset, scrollbarWidth } =
		useSyncExternalStore(
			isFloating ? store.subscribe : subscribeNoop,
			store.getSnapshot
		);

	// Moving blocks shifts anchors without resizing anything or re-registering.
	useLayoutEffect( () => {
		store.requestMeasure();
	}, [ store, threads ] );

	// Derived during render, so a resize reaches the screen in the same paint.
	const { positions: notePositions, contentHeight } = useMemo(
		() =>
			calculateNotePositions( {
				threads,
				selectedNoteId,
				blockRects: anchorRects,
				heights,
			} ),
		[ threads, selectedNoteId, anchorRects, heights ]
	);

	useCanvasRoom( { canvas, contentHeight, isFloating } );
	useMirroredScroll( { sidebarRef, canvas, isFloating } );
	usePanelOffsets( { sidebarRef, frameOffset, scrollbarWidth, isFloating } );

	return {
		notePositions,
		heights,
		registerThread: store.registerThread,
		unregisterThread: store.unregisterThread,
	};
}
