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
 *     update we force a fresh read of the note (via the note collection
 *     endpoint, the path a non-moderator suggester is allowed to read)
 *     rather than trusting this tab's possibly-stale cache; if the linkage is
 *     stale (resolved, or the note was deleted) we orphan it and create a
 *     fresh note. The fresh record is mirrored back into core-data so the
 *     sidebar stays in sync. PR #75147 widened `metadata.noteId` to an array
 *     so multiple notes can coexist on a block.
 *   - **In-flight id propagation**: the comment id learned by a create is
 *     recorded in a synchronous ref map (`commentIdsRef`) the instant it
 *     resolves, not only via React state. A save chained behind an in-flight
 *     one runs before React commits the new id, so reading it from state
 *     there would see `null` and POST a duplicate; the ref map closes that
 *     window.
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
import apiFetch from '@wordpress/api-fetch';
import { addQueryArgs } from '@wordpress/url';

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

	const { isSuggestMode, postId } = useSelect( ( select ) => {
		const editor = select( EDITOR_STORE_NAME );
		return {
			isSuggestMode: editor.getEditorIntent() === SUGGEST_INTENT,
			postId: editor.getCurrentPostId?.() ?? null,
		};
	}, [] );

	// Refs are read from inside async callbacks so a save always operates on
	// the latest overlay state, not the values captured when the timer was
	// scheduled. This avoids stale-closure pitfalls (e.g. acting on a null
	// commentId after the previous save just set one). Provider callbacks are
	// captured for the same reason: they change reference whenever
	// `postModified` updates, but the in-flight queue should always call the
	// latest version. The refs are synced from an effect rather than during
	// render so the rule against accessing refs while rendering is satisfied.
	const entriesRef = useRef( entries );
	const createRef = useRef( createSuggestion );
	const updateRef = useRef( updateSuggestion );
	const deleteRef = useRef( deleteSuggestion );
	const setCommentIdRef = useRef( setCommentId );
	const setSyncedOpsKeyRef = useRef( setSyncedOpsKey );
	const postIdRef = useRef( postId );

	useEffect( () => {
		entriesRef.current = entries;
		createRef.current = createSuggestion;
		updateRef.current = updateSuggestion;
		deleteRef.current = deleteSuggestion;
		setCommentIdRef.current = setCommentId;
		setSyncedOpsKeyRef.current = setSyncedOpsKey;
		postIdRef.current = postId;
	} );

	// Per-clientId debounce timer.
	const timersRef = useRef( new Map() );
	// Per-clientId promise chain. New saves are enqueued onto the existing
	// chain so saves on the same block always run sequentially — no races,
	// no duplicate POSTs, and no dropped work when the user keeps typing
	// during a slow network call.
	const queuesRef = useRef( new Map() );
	// Authoritative, synchronously-updated linkage for in-flight saves.
	//
	// The overlay's `commentId` / `syncedOpsKey` are also mirrored into React
	// state (so they survive a remount), but that round-trip is asynchronous:
	// `setCommentId` schedules a re-render, and `entriesRef` is only refreshed
	// from the follow-up effect. When the user keeps typing through a slow
	// save, the next save is chained directly behind the in-flight one and
	// runs as a microtask the instant it resolves — before React has committed
	// the new id. Reading the id back from `entriesRef` there would see `null`
	// and POST a duplicate note. These ref maps are written the moment a save
	// learns the id, so the queued save always sees it regardless of render
	// timing. The maps are seeded from overlay state on first touch so a
	// remount (which resets the refs but not the persisted state) re-links
	// instead of orphaning.
	const commentIdsRef = useRef( new Map() );
	const syncedKeysRef = useRef( new Map() );

	const syncOnce = useCallback(
		async ( clientId ) => {
			const entry = entriesRef.current[ clientId ];
			if ( ! entry ) {
				return;
			}
			const operations = operationsFromOverlay(
				entry.baselineAttributes,
				entry.overlayAttributes
			);
			const fingerprint = fingerprintOperations( operations );
			// Prefer the synchronously-tracked key over the (asynchronously
			// mirrored) overlay state so a save chained behind an in-flight one
			// doesn't re-run work the previous save already persisted.
			const lastSyncedKey = syncedKeysRef.current.has( clientId )
				? syncedKeysRef.current.get( clientId )
				: entry.syncedOpsKey;
			if ( fingerprint === lastSyncedKey ) {
				return;
			}

			// Read the linked comment id from the synchronous map (set the
			// instant the creating save resolved); fall back to overlay state
			// on first touch / after a remount.
			let commentId = commentIdsRef.current.has( clientId )
				? commentIdsRef.current.get( clientId )
				: entry.commentId;

			// The linked comment can outlive the note it points at: another
			// collaborator may have accepted or rejected the suggestion
			// mid-session, flipping the comment's status from `hold` to
			// `approved`/`spam`/etc. Updating that comment would clobber its
			// payload (and the resolved status header) with the user's new,
			// unrelated edit. A plain `select` would only see whatever this tab
			// has already cached, which may pre-date the peer's action — so
			// force a fresh GET below before deciding whether it is still live.
			// A resolved link is treated as if there were none, so the next
			// save creates a fresh note that coexists with the resolved one —
			// this only works because PR #75147 lets a block hold multiple
			// note ids in `metadata.noteId`.
			const currentPostId = postIdRef.current;
			if ( commentId && currentPostId ) {
				let linkedComment;
				try {
					// Query the note collection (filtered to this id) rather
					// than `GET /comments/<id>`: the note REST controller only
					// grants the single-item edit context to comment
					// moderators, but lets anyone with `edit_post` read a
					// post's notes through the collection — the same path the
					// sidebar's thread list uses. A cached `select` is avoided
					// so a peer's accept/reject is always seen. The fresh record
					// is mirrored back into core-data so the sidebar reflects
					// the new status too.
					const matches = await apiFetch( {
						path: addQueryArgs( '/wp/v2/comments', {
							post: currentPostId,
							type: 'note',
							status: 'all',
							include: [ commentId ],
							per_page: 1,
							context: 'edit',
						} ),
					} );
					linkedComment = Array.isArray( matches )
						? matches[ 0 ]
						: null;
					if ( linkedComment ) {
						registry
							.dispatch( coreStore )
							.receiveEntityRecords( 'root', 'comment', [
								linkedComment,
							] );
					}
				} catch {
					// A transient failure shouldn't strand the save; fall back
					// to the cached record and let the next edit re-check.
					linkedComment = registry
						.select( coreStore )
						.getEntityRecord( 'root', 'comment', commentId );
				}
				// A non-`hold` status means a peer resolved the note; orphan the
				// link so the next save spawns a fresh note instead of clobbering
				// the resolved one. An empty/unknown result is left alone — the
				// update will surface a server error if the note is truly gone,
				// and the next edit re-checks.
				if ( linkedComment && linkedComment.status !== 'hold' ) {
					commentId = null;
					commentIdsRef.current.set( clientId, null );
					setCommentIdRef.current( clientId, null );
				}
			}

			try {
				if ( operations.length === 0 ) {
					if ( commentId ) {
						await deleteRef.current( { commentId } );
						commentIdsRef.current.set( clientId, null );
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
						// Record the new id synchronously so a save already
						// queued behind this one updates the same note instead
						// of creating a second.
						commentIdsRef.current.set( clientId, saved.id );
						setCommentIdRef.current( clientId, saved.id );
					}
				}
				syncedKeysRef.current.set( clientId, fingerprint );
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
			const operations = operationsFromOverlay(
				entry.baselineAttributes,
				entry.overlayAttributes
			);
			const fingerprint = fingerprintOperations( operations );
			const lastSyncedKey = syncedKeysRef.current.has( clientId )
				? syncedKeysRef.current.get( clientId )
				: entry.syncedOpsKey;
			if ( fingerprint === lastSyncedKey ) {
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

		// Drop the synchronous linkage for blocks whose overlay has been
		// cleared (suggestion applied/rejected, or reverted and re-captured).
		// Without this a clientId reused by a fresh capture would inherit the
		// previous note id from the ref and update the old note instead of
		// creating a new one.
		for ( const map of [ commentIdsRef.current, syncedKeysRef.current ] ) {
			for ( const clientId of map.keys() ) {
				if ( ! entries[ clientId ] ) {
					map.delete( clientId );
				}
			}
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
