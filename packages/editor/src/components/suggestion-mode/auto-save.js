/**
 * Background auto-save for Suggest mode.
 *
 * Replaces the explicit "Submit suggestion" button (`commit-bar.js` in earlier
 * phases) with a debounced background save so a suggester sees their pending
 * change persist on its own after a short pause in typing — the same model
 * Google Docs uses for Suggesting mode.
 *
 * Behavior summary:
 *   - **Debounce**: per-block timer of `AUTOSAVE_DEBOUNCE_MS` (1500 ms).
 *     Each new edit on a block clears that block's timer and starts a new
 *     one; saves only fire during idle windows so a user typing through a
 *     paragraph generates one save, not one per keystroke.
 *   - **Per-block queue**: each `clientId` has a sequential promise chain
 *     (`queuesRef`). Saves on the same block are linked end-to-end so a
 *     slow network call doesn't race with a follow-up save and produce
 *     duplicate POSTs or out-of-order writes. Different blocks have
 *     independent queues and run concurrently.
 *   - **Create vs update vs delete**: a fresh overlay creates a new note;
 *     subsequent edits update the same note's `_wp_suggestion` meta; an
 *     overlay reverted back to baseline (user undid their suggestion)
 *     trashes the note.
 *   - **Collaboration**: the linked comment can be resolved by another peer
 *     mid-session (their accept/reject flips its `status`). Before each
 *     update we re-read the comment via core-data; if the linkage is stale
 *     we orphan it and create a fresh note. PR #75147 widened
 *     `metadata.noteId` to an array so multiple notes can coexist on a block.
 *
 * Refs are used heavily because:
 *   - The provider callbacks (`createSuggestion`, `updateSuggestion`,
 *     `deleteSuggestion`) are recreated whenever `postModified` changes,
 *     but in-flight saves always need the latest reference.
 *   - The save functions run inside a `setTimeout` callback that doesn't
 *     re-render, so reading the latest entries / callbacks via refs avoids
 *     stale-closure bugs without resubscribing on every overlay change.
 */
/**
 * WordPress dependencies
 */
import { useRegistry, useSelect } from '@wordpress/data';
import { store as coreStore } from '@wordpress/core-data';
import { useCallback, useEffect, useRef } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { useSuggestionOverlay } from './overlay-context';
import { operationsFromOverlay, useSuggestionsProvider } from './provider';
import { EDITOR_STORE_NAME, SUGGEST_INTENT } from './constants';

const AUTOSAVE_DEBOUNCE_MS = 1500;

/**
 * Deterministic fingerprint of a list of operations so we can detect whether
 * the overlay has changed relative to what we last synced without comparing
 * deep object trees on every render.
 *
 * @param {Array} operations Operations to fingerprint.
 * @return {string} Stable serialization.
 */
export function fingerprintOperations( operations ) {
	try {
		return JSON.stringify( operations );
	} catch {
		return '';
	}
}

/**
 * Derive the operation list a given overlay entry should persist.
 *
 * Structural entries (block-remove, block-insert-after, block-move) carry
 * a single pre-built op in `entry.structuralOp`; the interceptor wrote it
 * after detecting the corresponding tree mutation. Attribute-set entries
 * derive their ops from the baseline-vs-overlay diff. An entry can have
 * both — a user can edit attributes on a block that was suggested for
 * removal — in which case the structural op leads and any attribute ops
 * follow.
 *
 * @param {Object} entry Overlay entry.
 * @return {Array} Ops describing the entry's pending suggestion.
 */
export function operationsForEntry( entry ) {
	const ops = [];
	if ( entry.structuralOp ) {
		ops.push( entry.structuralOp );
	}
	const attrOps = operationsFromOverlay(
		entry.baselineAttributes,
		entry.overlayAttributes
	);
	for ( const op of attrOps ) {
		ops.push( op );
	}
	return ops;
}

/**
 * Invisible component that auto-commits pending overlay edits to the server
 * as note comments. Replaces the manual "Submit suggestion" button — in
 * Suggest mode each block's pending changes are persisted after a short
 * idle window, and subsequent edits update the same note rather than
 * spawning a new one.
 *
 * @return {null} Renders nothing.
 */
export default function SuggestionAutoSave() {
	const { entries, setCommentId, setSyncedOpsKey } = useSuggestionOverlay();
	const { createSuggestion, updateSuggestion, deleteSuggestion } =
		useSuggestionsProvider();
	const registry = useRegistry();

	const isSuggestMode = useSelect(
		( select ) =>
			select( EDITOR_STORE_NAME ).getEditorIntent() === SUGGEST_INTENT,
		[]
	);

	// Refs are read from inside async callbacks so a save always operates on
	// the latest overlay state, not the values captured when the timer was
	// scheduled. This avoids stale-closure pitfalls (e.g. acting on a null
	// commentId after the previous save just set one).
	const entriesRef = useRef( entries );
	entriesRef.current = entries;

	// Provider callbacks are captured in refs for the same reason: they
	// change reference whenever `postModified` updates, but the in-flight
	// queue should always call the latest version.
	const createRef = useRef( createSuggestion );
	createRef.current = createSuggestion;
	const updateRef = useRef( updateSuggestion );
	updateRef.current = updateSuggestion;
	const deleteRef = useRef( deleteSuggestion );
	deleteRef.current = deleteSuggestion;
	const setCommentIdRef = useRef( setCommentId );
	setCommentIdRef.current = setCommentId;
	const setSyncedOpsKeyRef = useRef( setSyncedOpsKey );
	setSyncedOpsKeyRef.current = setSyncedOpsKey;

	// Per-clientId debounce timer.
	const timersRef = useRef( new Map() );
	// Per-clientId promise chain. New saves are enqueued onto the existing
	// chain so saves on the same block always run sequentially — no races,
	// no duplicate POSTs, and no dropped work when the user keeps typing
	// during a slow network call.
	const queuesRef = useRef( new Map() );

	const syncOnce = useCallback(
		async ( clientId ) => {
			const entry = entriesRef.current[ clientId ];
			if ( ! entry ) {
				return;
			}
			const operations = operationsForEntry( entry );
			const fingerprint = fingerprintOperations( operations );
			if ( fingerprint === entry.syncedOpsKey ) {
				return;
			}

			// The overlay's `commentId` reference can outlive the note it
			// points at: another collaborator may have accepted or rejected
			// the suggestion mid-session, flipping the comment's status from
			// `hold` to `approved`. Updating that comment would clobber its
			// payload (and the resolved status header) with the user's new,
			// unrelated edit. Treat a resolved link as if there were none so
			// the next save creates a fresh note that coexists with the
			// resolved one — this only works because PR #75147 lets a block
			// hold multiple note ids in `metadata.noteId`.
			let commentId = entry.commentId;
			if ( commentId ) {
				const linkedComment = registry
					.select( coreStore )
					.getEntityRecord( 'root', 'comment', commentId );
				if ( linkedComment && linkedComment.status !== 'hold' ) {
					commentId = null;
					setCommentIdRef.current( clientId, null );
				}
			}

			try {
				if ( operations.length === 0 ) {
					if ( commentId ) {
						await deleteRef.current( { commentId } );
						setCommentIdRef.current( clientId, null );
					}
				} else if ( commentId ) {
					await updateRef.current( {
						commentId,
						blockName: entry.blockName,
						operations,
					} );
				} else {
					const saved = await createRef.current( {
						clientId,
						blockName: entry.blockName,
						operations,
					} );
					if ( saved?.id ) {
						setCommentIdRef.current( clientId, saved.id );
					}
				}
				setSyncedOpsKeyRef.current( clientId, fingerprint );
			} catch {
				// Error notice is surfaced inside the provider. The next overlay
				// change will re-enqueue a sync, so transient failures recover
				// on their own.
			}
		},
		[ registry ]
	);

	const enqueueSync = useCallback(
		( clientId ) => {
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

	useEffect( () => {
		if ( ! isSuggestMode ) {
			return undefined;
		}

		const timers = timersRef.current;

		for ( const [ clientId, entry ] of Object.entries( entries ) ) {
			const operations = operationsForEntry( entry );
			const fingerprint = fingerprintOperations( operations );
			if ( fingerprint === entry.syncedOpsKey ) {
				continue;
			}

			if ( timers.has( clientId ) ) {
				clearTimeout( timers.get( clientId ) );
			}
			const timer = setTimeout( () => {
				timers.delete( clientId );
				enqueueSync( clientId );
			}, AUTOSAVE_DEBOUNCE_MS );
			timers.set( clientId, timer );
		}

		return undefined;
	}, [ isSuggestMode, entries, enqueueSync ] );

	// Clear all pending timers on unmount.
	useEffect( () => {
		const timers = timersRef.current;
		return () => {
			for ( const timer of timers.values() ) {
				clearTimeout( timer );
			}
			timers.clear();
		};
	}, [] );

	return null;
}
