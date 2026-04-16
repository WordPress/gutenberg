/**
 * WordPress dependencies
 */
import { useSelect } from '@wordpress/data';
import { useEffect, useRef } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { useSuggestionOverlay } from './overlay-context';
import { operationsFromOverlay, useSuggestionsProvider } from './provider';
import { EDITOR_STORE_NAME } from './constants';

const AUTOSAVE_DEBOUNCE_MS = 1500;

/**
 * Deterministic fingerprint of a list of operations so we can detect whether
 * the overlay has changed relative to what we last synced without comparing
 * deep object trees on every render.
 *
 * @param {Array} operations Operations to fingerprint.
 * @return {string} Stable serialization.
 */
function fingerprintOperations( operations ) {
	try {
		return JSON.stringify( operations );
	} catch {
		return '';
	}
}

/**
 * Invisible component that auto-commits pending overlay edits to the server
 * as note comments. Replaces the manual "Submit suggestion" button — in
 * Suggest mode, each block's pending changes are persisted after a short
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
			select( EDITOR_STORE_NAME ).getEditorIntent?.() === 'suggest',
		[]
	);

	// Track pending debounce timers and in-flight syncs per clientId so we
	// don't race when the user keeps typing faster than the network.
	const timersRef = useRef( new Map() );
	const inFlightRef = useRef( new Set() );

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

			const timer = setTimeout( async () => {
				timers.delete( clientId );
				if ( inFlightRef.current.has( clientId ) ) {
					return;
				}
				inFlightRef.current.add( clientId );
				try {
					if ( operations.length === 0 ) {
						if ( entry.commentId ) {
							await deleteSuggestion( {
								commentId: entry.commentId,
							} );
							setCommentId( clientId, null );
						}
						setSyncedOpsKey( clientId, fingerprint );
						return;
					}
					if ( entry.commentId ) {
						await updateSuggestion( {
							commentId: entry.commentId,
							blockName: entry.blockName,
							operations,
						} );
					} else {
						const saved = await createSuggestion( {
							clientId,
							blockName: entry.blockName,
							operations,
						} );
						if ( saved?.id ) {
							setCommentId( clientId, saved.id );
						}
					}
					setSyncedOpsKey( clientId, fingerprint );
				} catch {
					// Error notice surfaced inside the provider. The debounce
					// timer will re-fire on the next overlay change.
				} finally {
					inFlightRef.current.delete( clientId );
				}
			}, AUTOSAVE_DEBOUNCE_MS );

			timers.set( clientId, timer );
		}

		return undefined;
	}, [
		isSuggestMode,
		entries,
		createSuggestion,
		updateSuggestion,
		deleteSuggestion,
		setCommentId,
		setSyncedOpsKey,
	] );

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
