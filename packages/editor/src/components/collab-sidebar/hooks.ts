/**
 * WordPress dependencies
 */
import { speak } from '@wordpress/a11y';
import { __ } from '@wordpress/i18n';
import {
	useState,
	useEffect,
	useMemo,
	useSyncExternalStore,
} from '@wordpress/element';
import { useEntityRecords, store as coreStore } from '@wordpress/core-data';
import { useDispatch, useRegistry, useSelect } from '@wordpress/data';
// @ts-expect-error - No type declarations available for @wordpress/block-editor
// prettier-ignore
import { store as blockEditorStore, privateApis as blockEditorPrivateApis } from '@wordpress/block-editor';
import { store as noticesStore } from '@wordpress/notices';
import { getScrollContainer } from '@wordpress/dom';
import { decodeEntities } from '@wordpress/html-entities';
// @ts-expect-error - No type declarations available for @wordpress/interface
import { store as interfaceStore } from '@wordpress/interface';
import { RichTextData, create, toHTMLString } from '@wordpress/rich-text';

/**
 * External dependencies
 */
import type { MutableRefObject } from 'react';

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
import type {
	BlockAttributes,
	NoteSegment,
	NoteSelectionPoint,
	Thread,
} from './utils';

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
						? clientIdsByNoteId.get( item.id ) ?? []
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

/**
 * Read an inline selection from block-editor selection state, returning
 * normalized anchor data when a non-collapsed selection sits inside a single
 * rich-text attribute. Returns null for block-level or collapsed selections.
 *
 * @param getSelectionStart Block-editor selector.
 * @param getSelectionEnd   Block-editor selector.
 * @return Normalized segment (clientId, attributeKey, start, end) or null.
 */
function readInlineSelection(
	getSelectionStart: () => NoteSelectionPoint | undefined,
	getSelectionEnd: () => NoteSelectionPoint | undefined
): NoteSegment | null {
	const start = getSelectionStart();
	const end = getSelectionEnd();
	if (
		! start?.clientId ||
		! end?.clientId ||
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
 * @param value Existing block attribute value.
 * @param id    New note id to embed as `data-id`.
 * @param start Range start offset.
 * @param end   Range end offset.
 * @return Wrapped value or null when the attribute isn't rich text.
 */
function wrapInlineNote(
	value: unknown,
	id: number,
	start: number,
	end: number
): RichTextData | null {
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
	return RichTextData.fromHTMLString( toHTMLString( { value: record } ) );
}

/**
 * Strip a note's inline `core/note` marker from every block that holds it, so a
 * deleted or resolved note's highlight does not linger in the content. A
 * multi-block note carries a marker in each block it spans, so this scans them
 * all. No-op for block-level notes (those carry no marker). Used by the resolve
 * path, which only knows the note id; the delete path strips markers inline.
 *
 * @param noteId                      Note id whose markers to remove.
 * @param getClientIdsWithDescendants Block-editor selector.
 * @param getBlockAttributes          Block-editor selector.
 * @param updateBlockAttributes       Block-editor action.
 */
function clearInlineNoteMarker(
	noteId: number,
	getClientIdsWithDescendants: () => string[],
	getBlockAttributes: (
		clientId: string
	) => BlockAttributes | null | undefined,
	updateBlockAttributes: (
		clientId: string,
		attributes: BlockAttributes
	) => void
) {
	for ( const clientId of getClientIdsWithDescendants() ) {
		const attributes = getBlockAttributes( clientId );
		const found = findNoteInBlock( attributes, noteId );
		if ( ! found ) {
			continue;
		}
		const next = removeNoteFormat(
			attributes?.[ found.attributeKey ],
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
				? captured ?? readNoteSegments()
				: [];
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

				// The note visibly updates in place, so there is no snackbar,
				// but screen reader users still need the confirmation.
				speak(
					status === 'approved'
						? __( 'Note marked as resolved.' )
						: __( 'Note reopened.' )
				);
			} else {
				const updateData = {
					id,
					content,
					status,
				};

				await saveEntityRecord( 'root', 'comment', updateData, {
					throwOnError: true,
				} );

				createNotice(
					// @ts-expect-error The notices types don't cover the
					// custom 'snackbar' status used here.
					'snackbar',
					__( 'Note updated.' ),
					{
						type: 'snackbar',
						isDismissible: true,
					}
				);
			}
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
			// anchor. Each block's metadata + marker fold into one attribute
			// update so it's a single undo step per block.
			if ( ! note.parent ) {
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
					updateBlockAttributes( clientId, newAttributes );
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
				disableComplementaryArea( 'core' );
			}
		};
	}, [ enabled, registry ] );
}

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
	const [ notePositions, setNotePositions ] = useState<
		Record< string, number >
	>( {} );
	const [ store ] = useState( createBoardStore );

	// The board store's snapshot is a heights map keyed by thread id; its JS
	// inference only sees an empty object literal.
	const heights = useSyncExternalStore(
		store.subscribe,
		store.getSnapshot
	) as Record< string, number >;

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
