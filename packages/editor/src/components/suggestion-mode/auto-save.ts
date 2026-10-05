/**
 * Background auto-save for Suggest mode.
 *
 * Replaces the explicit "Submit suggestion" button (`commit-bar.js` in earlier
 * phases) with a debounced background save so a suggester sees their pending
 * change persist on its own after a short pause in editing, the same model
 * Google Docs uses for Suggesting mode.
 *
 * The record of a pending suggestion is the block's `metadata.suggestion`
 * marker (see `marker.ts`); this component only turns markers into notes.
 *
 * Behavior summary:
 *   - **Debounce**: per-block timer of `AUTOSAVE_DEBOUNCE_MS` (1500 ms).
 *     Each change to a block's marker clears that block's timer and starts
 *     a new one; saves only fire during idle windows so a user editing a
 *     block repeatedly generates one save, not one per change.
 *   - **Per-block queue**: each `clientId` has a sequential promise chain
 *     (`queuesRef`). Saves on the same block are linked end-to-end so a
 *     slow network call doesn't race with a follow-up save and produce
 *     duplicate POSTs or out-of-order writes. Different blocks have
 *     independent queues and run concurrently.
 *   - **Create vs update vs delete**: a fresh marker creates a note and
 *     writes the note id back onto the marker; later marker changes update
 *     the same note's `_wp_suggestion` meta; a marker left with nothing to
 *     propose (its `after` equals the live attributes and it has no
 *     structural type) trashes the note. A marker that disappears (undo, a
 *     decision, the block removed) is the note collector's business, not
 *     this component's.
 *   - **Collaboration**: the linked comment can be resolved by another peer
 *     mid-session (their accept/reject flips its `status`). Before each
 *     update the comment is re-read via core-data; if the linkage is stale
 *     the next save creates a fresh note. A marker another author wrote
 *     (`authorId` differs from the current user) is theirs to save.
 *
 * Refs are used heavily because the provider callbacks are recreated
 * whenever `postModified` changes but in-flight saves always need the latest
 * reference, and the save functions run inside `setTimeout` callbacks.
 */
import { useRegistry, useSelect } from '@wordpress/data';
import { store as coreStore } from '@wordpress/core-data';
// @ts-expect-error No exported types
import { store as blockEditorStore } from '@wordpress/block-editor';
import { useCallback, useEffect, useRef } from '@wordpress/element';
import { useSuggestionSession } from './suggestion-session';
import type { StructuralCapture } from './suggestion-session';
import {
	operationsFromMarker,
	postOperationsFromTitle,
	parseSuggestionPayload,
	findStructuralOp,
	findInlineOp,
	structuralOpFromMarker,
} from './operations';
import type { SuggestionOperation, BlockTreeReader } from './operations';
import { readSuggestionMarker, proposedAttributes } from './marker';
import type { SuggestionMarker } from './marker';
import { getNoteIdsFromMetadata } from '../collab-sidebar/utils';
import { getBlockTreeVersion } from './block-tree-version';
import { useSuggestionsProvider } from './provider';
import { STORE_NAME, EDITOR_INTENT_SUGGEST } from '../../store/constants';
import { unlock } from '../../lock-unlock';

const AUTOSAVE_DEBOUNCE_MS = 1500;

/** Queue key for the post title, which is not a block. */
export const POST_TITLE_CLIENT_ID = '__post_title__';

/**
 * Deterministic fingerprint of a list of operations so we can detect whether
 * a marker has changed relative to what we last synced without comparing
 * deep object trees on every render.
 *
 * @param operations Operations to fingerprint.
 * @return Stable serialization.
 */
export function fingerprintOperations(
	operations: SuggestionOperation[]
): string {
	try {
		return JSON.stringify( operations );
	} catch {
		return '';
	}
}

/**
 * The operations a marked block should persist: the structural op (the
 * session's recorded capture when it has one, else derived from the marker)
 * first, then one attribute-set per proposed attribute.
 *
 * @param clientId   The marked block.
 * @param attributes Its live attributes.
 * @param marker     Its marker.
 * @param capture    The session's structural capture for it, if any.
 * @param tree       Block tree selectors.
 * @return Ops describing the block's pending suggestion.
 */
export function operationsForBlock(
	clientId: string,
	attributes: Record< string, any >,
	marker: SuggestionMarker,
	capture: StructuralCapture | undefined,
	tree: BlockTreeReader
): SuggestionOperation[] {
	const ops: SuggestionOperation[] = [];
	if ( marker.type !== 'pending-attributes' ) {
		const structural =
			capture?.op ?? structuralOpFromMarker( clientId, marker, tree );
		if ( structural ) {
			ops.push( structural );
		}
	}
	const { metadata: _meta, ...live } = attributes ?? {};
	for ( const op of operationsFromMarker(
		live,
		proposedAttributes( marker )
	) ) {
		ops.push( op );
	}
	return ops;
}

/** Per-block bookkeeping for the session; nothing here is content. */
interface Tracked {
	commentId: number | null;
	syncedOpsKey: string | null;
}

/**
 * A marker with no commentId can still have a note: the write-back after
 * create is best-effort, and a reload keeps `metadata.noteId`. Resolve the
 * block's pending note of the same shape so a second one is never opened.
 *
 * @param coreSelect    Core-data selectors.
 * @param metadata      Block metadata.
 * @param hasStructural Whether the marker is a structural one.
 * @return The linked pending note id, or null.
 */
function findLinkedPendingNote(
	coreSelect: any,
	metadata: any,
	hasStructural: boolean
): number | null {
	for ( const noteId of getNoteIdsFromMetadata( metadata ) ) {
		const note: any = coreSelect.getEntityRecord(
			'root',
			'comment',
			noteId
		);
		if ( ! note || note.status !== 'hold' ) {
			continue;
		}
		const payload = parseSuggestionPayload( note.meta?._wp_suggestion );
		if ( ! payload || findInlineOp( payload.operations ) ) {
			continue;
		}
		if ( !! findStructuralOp( payload.operations ) === hasStructural ) {
			return Number( noteId );
		}
	}
	return null;
}

/**
 * Invisible component that persists marked blocks to the server as note
 * comments. In Suggest mode each block's pending marker is saved after a
 * short idle window, and later marker changes update the same note rather
 * than spawning a new one.
 *
 * @return Renders nothing.
 */
export default function SuggestionAutoSave() {
	const { getStructuralCaptures, postTitleProposal } = useSuggestionSession();
	const { createSuggestion, updateSuggestion, deleteSuggestion } =
		useSuggestionsProvider();
	const registry = useRegistry();

	const { isSuggestMode, treeVersion, currentUserId } = useSelect(
		( select ) => ( {
			// `getEditorIntent` is private while Suggest mode is experimental.
			isSuggestMode:
				unlock( select( STORE_NAME ) ).getEditorIntent() ===
				EDITOR_INTENT_SUGGEST,
			treeVersion: getBlockTreeVersion( select( blockEditorStore ) ),
			currentUserId:
				( select( coreStore ) as any )?.getCurrentUser?.()?.id ?? null,
		} ),
		[]
	);

	// Provider callbacks are captured in refs: they change reference
	// whenever `postModified` updates, but the in-flight queue should always
	// call the latest version.
	const createRef = useRef( createSuggestion );
	createRef.current = createSuggestion;
	const updateRef = useRef( updateSuggestion );
	updateRef.current = updateSuggestion;
	const deleteRef = useRef( deleteSuggestion );
	deleteRef.current = deleteSuggestion;
	const titleRef = useRef( postTitleProposal );
	titleRef.current = postTitleProposal;

	// Per-clientId debounce timer.
	const timersRef = useRef(
		new Map< string, ReturnType< typeof setTimeout > >()
	);
	// Per-clientId promise chain (see the header).
	const queuesRef = useRef( new Map< string, Promise< void > >() );
	// Session bookkeeping per block: the note id as of the last save (a
	// synchronous mirror of the marker's `commentId`, so a save queued right
	// after a create sees the fresh id before the marker write renders) and
	// the fingerprint of the operations last persisted.
	const trackedRef = useRef( new Map< string, Tracked >() );
	// Marker identity seen at the last scheduling pass, per block.
	const scheduledRef = useRef( new Map< string, SuggestionMarker | null >() );

	const track = useCallback( ( clientId: string ): Tracked => {
		let tracked = trackedRef.current.get( clientId );
		if ( ! tracked ) {
			tracked = { commentId: null, syncedOpsKey: null };
			trackedRef.current.set( clientId, tracked );
		}
		return tracked;
	}, [] );

	const readBlock = useCallback(
		( clientId: string ) => {
			const blockEditor: any = registry.select( blockEditorStore );
			const attributes = blockEditor.getBlockAttributes( clientId );
			const marker = readSuggestionMarker( attributes );
			return { blockEditor, attributes, marker };
		},
		[ registry ]
	);

	const writeCommentId = useCallback(
		( clientId: string, id: number | null ) => {
			track( clientId ).commentId = id;
			if ( clientId === POST_TITLE_CLIENT_ID ) {
				return;
			}
			const { attributes, marker } = readBlock( clientId );
			if ( ! marker || marker.commentId === ( id ?? undefined ) ) {
				return;
			}
			const { commentId: _old, ...rest } = marker;
			const next = id ? { ...rest, commentId: id } : rest;
			const dispatch: any = registry.dispatch( blockEditorStore );
			// Bookkeeping, not an edit: keep it off the undo stack.
			dispatch.__unstableMarkNextChangeAsNotPersistent( {
				history: 'ignore',
			} );
			dispatch.updateBlockAttributes( clientId, {
				metadata: { ...attributes.metadata, suggestion: next },
			} );
		},
		[ registry, readBlock, track ]
	);

	const syncOnce = useCallback(
		async ( clientId: string ) => {
			let operations: SuggestionOperation[];
			let blockName = '';
			let metadata: any;
			let marker: SuggestionMarker | null = null;
			if ( clientId === POST_TITLE_CLIENT_ID ) {
				operations = postOperationsFromTitle( titleRef.current );
			} else {
				const block = readBlock( clientId );
				marker = block.marker;
				if ( ! marker ) {
					// The marker is gone (undo, decision, block removed). The
					// note collector owns that transition; nothing to save.
					return;
				}
				blockName = block.blockEditor.getBlockName( clientId ) ?? '';
				metadata = block.attributes.metadata;
				operations = operationsForBlock(
					clientId,
					block.attributes,
					marker,
					getStructuralCaptures().get( clientId ),
					block.blockEditor
				);
			}
			const tracked = track( clientId );
			const fingerprint = fingerprintOperations( operations );
			if ( fingerprint === tracked.syncedOpsKey ) {
				return;
			}

			const coreSelect: any = registry.select( coreStore );
			let commentId: number | null = tracked.commentId;
			if ( ! commentId && marker ) {
				commentId =
					marker.commentId ??
					findLinkedPendingNote(
						coreSelect,
						metadata,
						marker.type !== 'pending-attributes'
					);
			}
			// The link can outlive the note it points at: another
			// collaborator may have accepted or rejected the suggestion
			// mid-session. Treat a resolved link as none so the next save
			// creates a fresh note that coexists with the resolved one.
			if ( commentId ) {
				const linked: any = coreSelect.getEntityRecord(
					'root',
					'comment',
					commentId
				);
				if ( linked && linked.status !== 'hold' ) {
					commentId = null;
					writeCommentId( clientId, null );
				}
			}

			try {
				if ( operations.length === 0 ) {
					if ( commentId ) {
						await deleteRef.current( {
							commentId,
							clientId:
								clientId === POST_TITLE_CLIENT_ID
									? undefined
									: clientId,
						} );
						writeCommentId( clientId, null );
					}
				} else if ( commentId ) {
					await updateRef.current( {
						commentId,
						blockName,
						operations,
					} );
					tracked.commentId = commentId;
				} else {
					const saved = await createRef.current( {
						clientId:
							clientId === POST_TITLE_CLIENT_ID
								? undefined
								: clientId,
						blockName,
						operations,
					} );
					if ( saved?.id ) {
						writeCommentId( clientId, saved.id );
					}
				}
				tracked.syncedOpsKey = fingerprint;
			} catch {
				// The provider surfaced the notice; the next marker change
				// re-enqueues a sync, so transient failures recover.
			}
		},
		[ registry, readBlock, writeCommentId, getStructuralCaptures, track ]
	);

	const enqueueSync = useCallback(
		( clientId: string ) => {
			const queues = queuesRef.current;
			const previous = queues.get( clientId ) ?? Promise.resolve();
			const next = previous
				.catch( () => {} )
				.then( () => syncOnce( clientId ) );
			queues.set( clientId, next );
			next.finally( () => {
				if ( queues.get( clientId ) === next ) {
					queues.delete( clientId );
				}
			} );
		},
		[ syncOnce ]
	);

	const schedule = useCallback(
		( clientId: string ) => {
			const timers = timersRef.current;
			if ( timers.has( clientId ) ) {
				clearTimeout( timers.get( clientId ) );
			}
			timers.set(
				clientId,
				// eslint-disable-next-line @wordpress/react-no-unsafe-timeout -- Tracked in `timersRef`, flushed on unmount.
				setTimeout( () => {
					timers.delete( clientId );
					enqueueSync( clientId );
				}, AUTOSAVE_DEBOUNCE_MS )
			);
		},
		[ enqueueSync ]
	);

	// Blocks: one pass per tree change; only a block whose marker identity
	// changed restarts its own timer, so steady editing in one block never
	// postpones another block's save.
	useEffect( () => {
		const timers = timersRef.current;

		/*
		 * Leaving Suggest mode flushes every pending debounce instead of
		 * waiting it out. The component stays mounted across intent changes
		 * (it is gated on the experiment flag, not the intent), and switching
		 * to Editing is a normal step in reviewing or publishing: the edit
		 * was made as a suggestion, so it must reach the server now.
		 */
		if ( ! isSuggestMode ) {
			for ( const [ clientId, timer ] of timers ) {
				clearTimeout( timer );
				enqueueSync( clientId );
			}
			timers.clear();
			// Re-entering Suggest mode reconsiders every marker.
			scheduledRef.current.clear();
			return;
		}

		const blockEditor: any = registry.select( blockEditorStore );
		const seen = new Set< string >();
		for ( const clientId of blockEditor.getClientIdsWithDescendants?.() ??
			[] ) {
			const marker = readSuggestionMarker(
				blockEditor.getBlockAttributes( clientId )
			);
			if ( ! marker ) {
				continue;
			}
			// A proposal another user wrote (it reached us through sync) is
			// theirs to save; saving it here would open a note in our name.
			// Until the current user resolves, every authored marker waits;
			// the pass re-runs once it does.
			if (
				marker.authorId !== null &&
				marker.authorId !== undefined &&
				marker.authorId !== currentUserId
			) {
				continue;
			}
			seen.add( clientId );
			if ( scheduledRef.current.get( clientId ) === marker ) {
				continue;
			}
			scheduledRef.current.set( clientId, marker );
			schedule( clientId );
		}
		for ( const clientId of scheduledRef.current.keys() ) {
			if ( ! seen.has( clientId ) ) {
				scheduledRef.current.delete( clientId );
			}
		}
	}, [
		isSuggestMode,
		treeVersion,
		currentUserId,
		registry,
		schedule,
		enqueueSync,
	] );

	// Title: its own slot.
	useEffect( () => {
		if ( isSuggestMode && postTitleProposal ) {
			schedule( POST_TITLE_CLIENT_ID );
		}
	}, [ isSuggestMode, postTitleProposal, schedule ] );

	// Save anything still waiting out its debounce on unmount (the
	// experiment toggled off, the editor closed) rather than dropping it.
	const enqueueSyncRef = useRef( enqueueSync );
	useEffect( () => {
		enqueueSyncRef.current = enqueueSync;
	}, [ enqueueSync ] );
	useEffect( () => {
		const timers = timersRef.current;
		return () => {
			for ( const [ clientId, timer ] of timers ) {
				clearTimeout( timer );
				enqueueSyncRef.current( clientId );
			}
			timers.clear();
		};
	}, [] );

	return null;
}
