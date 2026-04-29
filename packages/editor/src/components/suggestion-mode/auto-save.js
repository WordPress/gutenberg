/**
 * WordPress dependencies
 */
import { useSelect } from '@wordpress/data';
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

	const syncOnce = useCallback( async ( clientId ) => {
		const entry = entriesRef.current[ clientId ];
		if ( ! entry ) {
			return;
		}
		const operations = operationsFromOverlay(
			entry.baselineAttributes,
			entry.overlayAttributes
		);
		const fingerprint = fingerprintOperations( operations );
		if ( fingerprint === entry.syncedOpsKey ) {
			return;
		}

		try {
			if ( operations.length === 0 ) {
				if ( entry.commentId ) {
					await deleteRef.current( {
						commentId: entry.commentId,
					} );
					setCommentIdRef.current( clientId, null );
				}
			} else if ( entry.commentId ) {
				await updateRef.current( {
					commentId: entry.commentId,
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
	}, [] );

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
