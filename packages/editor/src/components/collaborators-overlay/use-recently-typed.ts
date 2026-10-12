import { useDebounce } from '@wordpress/compose';
import { useCallback, useEffect, useState } from '@wordpress/element';

/**
 * Tracks whether a key was pressed in the given document within the last
 * `delayMs`.
 *
 * The block editor's `isTyping` state turns on at the first keystroke and
 * stays on until the pointer moves, so on its own it cannot tell a pause in
 * typing apart from someone who simply has not touched the mouse. Pairing it
 * with this hook gives the overlay a signal that lapses on its own, so
 * anything hidden while typing comes back for keyboard-only users too.
 *
 * @param ownerDocument - Document to listen to, usually the editor canvas.
 * @param delayMs       - How long after the last keystroke to stay `true`.
 * @return Whether a keystroke landed within the last `delayMs`.
 */
export function useRecentlyTyped(
	ownerDocument: Document | null,
	delayMs: number
): boolean {
	const [ recentlyTyped, setRecentlyTyped ] = useState( false );

	// Stable, so `useDebounce` doesn't discard the pending call every render.
	const endTypingPause = useCallback(
		() => setRecentlyTyped( false ),
		[ setRecentlyTyped ]
	);
	const scheduleEndOfTypingPause = useDebounce( endTypingPause, delayMs );

	useEffect( () => {
		if ( ! ownerDocument ) {
			return;
		}

		function handleKeyDown() {
			// React bails out when the value is unchanged, so setting this on
			// every keystroke does not re-render once it is already true.
			setRecentlyTyped( true );
			scheduleEndOfTypingPause();
		}

		// Capture phase: rich text stops propagation for some keys, and a
		// keystroke that never reached us would let the avatar reappear while
		// the user is still writing.
		ownerDocument.addEventListener( 'keydown', handleKeyDown, true );

		return () => {
			ownerDocument.removeEventListener( 'keydown', handleKeyDown, true );
			scheduleEndOfTypingPause.cancel();
			// The canvas document is replaced when the device preview changes.
			// Start the next one clean rather than inheriting a stale "still
			// typing" from the document that just went away.
			setRecentlyTyped( false );
		};
	}, [ ownerDocument, scheduleEndOfTypingPause ] );

	return recentlyTyped;
}
