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
import { getBlockType } from '@wordpress/blocks';
import { RichTextData } from '@wordpress/rich-text';
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
	getBlockLevelClientIds,
	focusNoteThread,
	getInlineMarkerStart,
	getNoteIdsFromMetadata,
	addNoteIdToMetadata,
	getNoteAtCaret,
	getNoteRanges,
	getSoleRichTextAttributeKey,
	hasBlockDraft,
	pickNoteForCaret,
	removeInlineNote,
	removeNoteIdFromMetadata,
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
		// Duplicating or splitting a block copies its notes, so a note can
		// belong to several blocks.
		const clientIdsByNoteId = new Map();
		for ( const clientId of clientIds ) {
			const metadata = getBlockAttributes( clientId )?.metadata;
			const noteIds = getNoteIdsFromMetadata( metadata );
			if ( noteIds.length === 0 ) {
				continue;
			}
			blocksWithNotes[ clientId ] = noteIds;
			for ( const noteId of noteIds ) {
				if ( ! clientIdsByNoteId.has( noteId ) ) {
					clientIdsByNoteId.set( noteId, [] );
				}
				clientIdsByNoteId.get( noteId ).push( clientId );
			}
		}

		// Materialize threads; collect roots; replies linked in a second pass
		// via unshift to invert order (matches prior reverse semantics).
		const threadsById = new Map();
		const rootThreads = [];
		for ( const item of threads ) {
			const blockClientIds =
				( item.parent === 0 && clientIdsByNoteId.get( item.id ) ) || [];
			const thread = {
				...item,
				reply: [],
				// The first block is where a shared note is listed, and where
				// it shows unless another of its blocks is selected (see
				// `getAnchorClientId`).
				blockClientIds,
				blockClientId: blockClientIds[ 0 ] ?? null,
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
					if ( ! thread || thread.blockClientId !== clientId ) {
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
		getBlockCount,
		getBlockName,
		getSelectedBlockClientIds,
		getSelectionStart,
		getSelectionEnd,
		__unstableIsFullySelected: isFullySelected,
		__unstableIsSelectionCollapsed: isSelectionCollapsed,
	} = useSelect( blockEditorStore );
	const {
		updateBlockAttributes,
		__unstableMarkNextChangeAsNotPersistent,
		__unstableMarkLastChangeAsPersistent,
	} = useDispatch( blockEditorStore );

	// Splitting and merging store rich text as an HTML string, but the
	// marker helpers only write rich text data.
	const getNoteAttributes = ( clientId ) => {
		const attributes = getBlockAttributes( clientId );
		if ( ! attributes ) {
			return attributes;
		}
		const schema = getBlockType( getBlockName( clientId ) )?.attributes;
		return Object.fromEntries(
			Object.entries( attributes ).map( ( [ key, value ] ) => [
				key,
				typeof value === 'string' &&
				schema?.[ key ]?.type === 'rich-text'
					? RichTextData.fromHTMLString( value )
					: value,
			] )
		);
	};

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
	const updateNoteAnchor = ( clientIds, attributes, options ) => {
		__unstableMarkNextChangeAsNotPersistent( { history: 'ignore' } );
		updateBlockAttributes( clientIds, attributes, options );
		__unstableMarkLastChangeAsPersistent();
	};

	const updateNoteAnchors = ( clientIds, getNewAttributes ) => {
		const attributesByClientId = {};
		for ( const clientId of clientIds ) {
			const attributes = getNoteAttributes( clientId );
			if ( ! attributes ) {
				continue;
			}
			const newAttributes = getNewAttributes( attributes, clientId );
			if ( newAttributes && Object.keys( newAttributes ).length > 0 ) {
				attributesByClientId[ clientId ] = newAttributes;
			}
		}
		const updatedClientIds = Object.keys( attributesByClientId );
		if ( updatedClientIds.length > 0 ) {
			updateNoteAnchor( updatedClientIds, attributesByClientId, {
				uniqueByBlock: true,
			} );
		}
	};

	const removeNoteMarker = ( clientIds, noteId ) =>
		updateNoteAnchors( clientIds, ( attributes ) => {
			const removed = removeInlineNote( attributes, noteId );
			return removed && { [ removed.attributeKey ]: removed.value };
		} );

	// A caret or whole blocks select no text.
	const getSelectedNoteRanges = ( clientIds ) =>
		isFullySelected() || isSelectionCollapsed()
			? new Map()
			: getNoteRanges( {
					blocks: clientIds.map( ( clientId ) => ( {
						clientId,
						attributes: getNoteAttributes( clientId ),
						attributeKey: getBlockCount( clientId )
							? undefined
							: getSoleRichTextAttributeKey(
									getBlockName( clientId )
								),
					} ) ),
					selectionStart: getSelectionStart(),
					selectionEnd: getSelectionEnd(),
				} );

	// A text block the selection gives no text, like the block a selection
	// starts at the end of, isn't part of a new note, unless no block has any:
	// the note then takes them all as whole blocks.
	const getNoteClientIds = () => {
		const clientIds = getSelectedBlockClientIds();
		const ranges = getSelectedNoteRanges( clientIds );
		const textClientIds = clientIds.filter( ( clientId ) => {
			const range = ranges.get( clientId );
			return ! range || range.start < range.end;
		} );
		return textClientIds.length ? textClientIds : clientIds;
	};

	// The draft marker (id `new`) wraps the text an unsent note is about, so
	// the anchor follows edits until the note is sent.
	const onDiscard = ( clientIds ) => removeNoteMarker( clientIds, 'new' );

	// Starting again from another selection moves the marker. A caret or the
	// whole block keeps it, so a block's unsent draft keeps its text; across
	// blocks, a marker left by one block's draft isn't this note's.
	const onStart = ( clientIds ) => {
		const selectedClientIds = getSelectedBlockClientIds();
		if (
			clientIds[ 0 ] !== selectedClientIds[ 0 ] ||
			clientIds.length !== selectedClientIds.length
		) {
			return;
		}
		const ranges = getSelectedNoteRanges( clientIds );
		if ( ! ranges.size && clientIds.length === 1 ) {
			return;
		}
		updateNoteAnchors( clientIds, ( attributes, clientId ) => {
			const newAttributes = {};
			const removed = removeInlineNote( attributes, 'new' );
			if ( removed ) {
				newAttributes[ removed.attributeKey ] = removed.value;
			}
			const range = ranges.get( clientId );
			if ( range ) {
				const { attributeKey, start, end } = range;
				const value =
					newAttributes[ attributeKey ] ?? attributes[ attributeKey ];
				const wrapped =
					start < end && wrapInlineNote( value, 'new', start, end );
				if ( wrapped ) {
					newAttributes[ attributeKey ] = wrapped;
				}
			}
			return newAttributes;
		} );
	};

	const onCreate = async ( { content, parent } ) => {
		try {
			// Capture the target blocks *before* the async save: selection may
			// shift during the round-trip, attaching the note to the wrong block.
			const clientIds = ! parent ? getNoteClientIds() : [];

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
			if ( ! parent && savedRecord?.id ) {
				updateNoteAnchors( clientIds, ( attributes ) => {
					const newAttributes = {
						metadata: cleanEmptyObject(
							addNoteIdToMetadata(
								attributes.metadata,
								savedRecord.id
							)
						),
					};

					// Inline path: the draft marker becomes the note's marker.
					const draft = removeInlineNote( attributes, 'new' );
					if ( draft ) {
						newAttributes[ draft.attributeKey ] = wrapInlineNote(
							draft.value,
							savedRecord.id,
							draft.start,
							draft.end
						);
					}
					return newAttributes;
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
				if ( status === 'approved' ) {
					removeNoteMarker( note.blockClientIds, id );
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

	const restoreNote = async ( noteId, anchors ) => {
		try {
			// Untrash first, so a failure doesn't leave an anchor without a note.
			await saveEntityRecord(
				'root',
				'comment',
				{ id: noteId, status: 'untrash' },
				{ throwOnError: true }
			);

			// No anchors (a reply or an orphan), or their blocks are gone:
			// the note comes back on its own.
			updateNoteAnchors( anchors.keys(), ( attributes, clientId ) => {
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
				const inline = anchors.get( clientId );
				const value = inline && attributes[ inline.attributeKey ];
				// Re-wrap only text that hasn't changed since the delete;
				// otherwise the note comes back as a block-level note.
				if (
					inline &&
					! findNoteInBlock( attributes, noteId ) &&
					value?.text?.slice( inline.start, inline.end ) ===
						inline.text
				) {
					const wrapped = wrapInlineNote(
						value,
						noteId,
						inline.start,
						inline.end
					);
					if ( wrapped ) {
						newAttributes[ inline.attributeKey ] = wrapped;
					}
				}
				return newAttributes;
			} );

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

			// What Undo needs to re-attach the note to its blocks.
			const anchors = new Map();
			updateNoteAnchors(
				note.blockClientIds,
				( attributes, clientId ) => {
					if (
						! getNoteIdsFromMetadata(
							attributes.metadata
						).includes( note.id )
					) {
						return null;
					}
					const newAttributes = {
						metadata: cleanEmptyObject(
							removeNoteIdFromMetadata(
								attributes.metadata,
								note.id
							)
						),
					};
					// Strip the inline marker too (if any) so the deleted note's
					// highlight doesn't linger in the content.
					let inline = null;
					const removed = removeInlineNote( attributes, note.id );
					if ( removed ) {
						const { attributeKey, start, end, value } = removed;
						newAttributes[ attributeKey ] = value;
						inline = {
							attributeKey,
							start,
							end,
							text: value.text.slice( start, end ),
						};
					}
					anchors.set( clientId, inline );
					return newAttributes;
				}
			);

			createNotice( 'snackbar', __( 'Note deleted.' ), {
				type: 'snackbar',
				isDismissible: true,
				actions: canMoveToTrash
					? [
							{
								label: __( 'Undo' ),
								onClick: () => restoreNote( note.id, anchors ),
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

const isSamePoint = ( a, b ) =>
	a.clientId === b.clientId &&
	a.attributeKey === b.attributeKey &&
	a.offset === b.offset;

/**
 * Calls back when the caret moves. Skips typing: a selection change batched
 * with a content change moves the caret with the text, never across a marker.
 * A store subscription, not `useSelect`: nothing renders from it.
 *
 * @param {(caret: Object) => void} onChange Receives `{ clientIds, previousClientIds, isBlockChange, attributes, noteAtCaret }`; `attributes` only while one block is selected.
 */
function useCaretChange( onChange ) {
	const registry = useRegistry();
	const handleChange = useEvent( onChange );
	useEffect( () => {
		const {
			getBlockAttributes,
			getSelectedBlockClientIds,
			getSelectionStart,
			getSelectionEnd,
		} = registry.select( blockEditorStore );
		// The caret rules read one block's markers.
		const getCaretAttributes = ( ids ) =>
			ids.length === 1 ? getBlockAttributes( ids[ 0 ] ) : undefined;
		let clientIds = getSelectedBlockClientIds();
		let attributes = getCaretAttributes( clientIds );
		let selectionStart = getSelectionStart();
		let selectionEnd = getSelectionEnd();
		return registry.subscribe( () => {
			const previousClientIds = clientIds;
			const previousAttributes = attributes;
			clientIds = getSelectedBlockClientIds();
			attributes = getCaretAttributes( clientIds );
			if (
				getSelectionStart() === selectionStart &&
				getSelectionEnd() === selectionEnd
			) {
				return;
			}
			const isSameSelection =
				isSamePoint( getSelectionStart(), selectionStart ) &&
				isSamePoint( getSelectionEnd(), selectionEnd );
			selectionStart = getSelectionStart();
			selectionEnd = getSelectionEnd();
			// A selection across blocks is one anchor, so moving either of its
			// ends moves to another, as entering another block does. The store
			// can replace the ends without moving them.
			const isBlockChange =
				( clientIds.length > 1 && ! isSameSelection ) ||
				clientIds.length !== previousClientIds.length ||
				clientIds.some(
					( clientId, index ) =>
						clientId !== previousClientIds[ index ]
				);
			if ( ! isBlockChange && attributes !== previousAttributes ) {
				return;
			}
			handleChange( {
				clientIds,
				previousClientIds,
				isBlockChange,
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
 * @param {Object}                        props
 * @param {Array}                         props.notes     Threads shown in the sidebar.
 * @param {Map}                           props.drafts    Unsent note drafts, see `NoteDraftsContext`.
 * @param {(clientIds: string[]) => void} props.onDiscard Drops the draft marker of a form's blocks.
 */
export function useNoteSelection( { notes, drafts, onDiscard } ) {
	const { getBlockAttributes, getBlockCount, getBlockName } =
		useSelect( blockEditorStore );
	const { getSelectedNote } = unlock( useSelect( editorStore ) );
	const { selectNote } = unlock( useDispatch( editorStore ) );

	useCaretChange( ( caret ) => {
		const selectedNoteId = getSelectedNote();
		// Duplicating or splitting selects the new block before `notes`
		// re-renders with it, so read the block's notes from the store and
		// count it among each note's blocks.
		const [ clientId ] = caret.clientIds;
		const blockNoteIds = getNoteIdsFromMetadata(
			caret.attributes?.metadata
		);
		const isTextBlock = ( id ) =>
			! getBlockCount( id ) &&
			!! getSoleRichTextAttributeKey( getBlockName( id ) );
		const noteId = pickNoteForCaret( {
			...caret,
			blockThreads: notes.filter(
				( thread ) =>
					blockNoteIds.includes( thread.id ) &&
					getBlockLevelClientIds(
						thread.id,
						[ ...thread.blockClientIds, clientId ],
						getBlockAttributes,
						isTextBlock
					).includes( clientId )
			),
			hasDraft: hasBlockDraft( drafts, caret.clientIds ),
			selectedNoteId,
		} );

		// Leaving an empty new note form strips its draft marker.
		const isLeavingForm =
			selectedNoteId === 'new' &&
			( caret.isBlockChange || noteId !== 'new' );
		if (
			isLeavingForm &&
			! hasBlockDraft( drafts, caret.previousClientIds )
		) {
			onDiscard( caret.previousClientIds );
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
 * @param {Object}                        props
 * @param {Map}                           props.drafts    Unsent note drafts, see `NoteDraftsContext`.
 * @param {(clientIds: string[]) => void} props.onDiscard Drops the draft marker of a form's blocks.
 *
 * @return {(noteId: number|string, clientId: ?string, options?: Object) => void} Picks a note, see `selectNote` for the options.
 */
export function usePickNote( { drafts, onDiscard } ) {
	const { getSelectedBlockClientIds } = useSelect( blockEditorStore );
	const { getSelectedNote } = unlock( useSelect( editorStore ) );
	const { selectBlock, toggleBlockHighlight } = unlock(
		useDispatch( blockEditorStore )
	);
	const { selectNote } = unlock( useDispatch( editorStore ) );
	return ( noteId, clientId, options ) => {
		const formClientIds = getSelectedBlockClientIds();
		if ( clientId ) {
			// A new note keeps the blocks it's added to selected.
			if ( noteId !== 'new' || ! formClientIds.includes( clientId ) ) {
				// `null`: don't move focus to the block.
				selectBlock( clientId, null );
			}
			toggleBlockHighlight( clientId, true );
		}

		// No caret event strips the marker here, and the form unmounts before its focus-out runs.
		if (
			getSelectedNote() === 'new' &&
			noteId !== 'new' &&
			! hasBlockDraft( drafts, formClientIds )
		) {
			onDiscard( formClientIds );
		}
		selectNote( noteId, options );
	};
}

/**
 * Focuses the selected note's thread when the selection asks for it. Lives
 * with the threads' DOM: the sidebar ref is only set once they render.
 *
 * @param {Object}  props
 * @param {Object}  props.sidebarRef Ref to the sidebar element.
 * @param {boolean} props.isPlaced   Whether the selected thread is positioned; focusing it earlier scrolls the canvas to the top.
 */
export function useNoteFocus( { sidebarRef, isPlaced } ) {
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
		if ( ! noteFocused || ! selectedNote || ! isPlaced ) {
			return;
		}
		focusNoteThread(
			selectedNote,
			sidebarRef.current,
			selectedNote === 'new' ? '[role="textbox"]' : undefined
		);
		// Re-select without the flag so the focus happens once.
		selectNote( selectedNote );
	}, [ noteFocused, selectedNote, isPlaced, selectNote, sidebarRef ] );
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
