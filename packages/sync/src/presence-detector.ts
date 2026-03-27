/**
 * External dependencies
 */
import type { Awareness } from 'y-protocols/awareness';

/**
 * Internal dependencies
 */
import type { PresenceCheckResult } from './types';

/**
 * Lightweight presence detector that polls at a low frequency to check if any
 * other editors are present for a given room.
 *
 * Unlike the full sync provider, this only checks awareness state — it does
 * not exchange document updates, keeping the payload minimal.
 *
 * The actual network call is delegated to a `checkPresence` callback provided
 * by the consumer (e.g. core-data), keeping this module WordPress-agnostic.
 *
 * When another editor is detected, it fires the `onCollaboratorDetected`
 * callback, allowing the caller to upgrade to a full sync connection.
 */

/**
 * Default polling interval for presence detection (10 seconds).
 * This is slower than the full sync polling (4s) since we're only
 * looking for presence, not syncing data. 10s balances detection
 * latency against request volume — the server-side `presence_only`
 * flag makes each poll cheap (no update retrieval).
 */
const PRESENCE_POLL_INTERVAL_MS = 10_000;

/**
 * Background tab polling interval (20 seconds).
 */
const PRESENCE_POLL_INTERVAL_BACKGROUND_MS = 20_000;

interface PresenceDetectorOptions {
	room: string;
	clientId: number;
	awareness: Awareness;
	checkPresence: ( options: {
		room: string;
		clientId: number;
		localAwarenessState: Record< string, unknown >;
	} ) => Promise< PresenceCheckResult >;
	onCollaboratorDetected: () => void;
}

interface PresenceDetectorResult {
	destroy: () => void;
}

/**
 * Create a lightweight presence detector that polls for other editors.
 *
 * The detector sends only awareness state (no document updates) and checks
 * the response for the presence of other clients. When another client is
 * detected, it calls `onCollaboratorDetected` and stops polling.
 *
 * @param options                        Presence detector configuration.
 * @param options.room                   The sync room identifier.
 * @param options.clientId               The local client ID.
 * @param options.awareness              The Awareness instance for local state.
 * @param options.checkPresence          Platform-specific presence check callback.
 * @param options.onCollaboratorDetected Callback when another editor is detected.
 */
export function createPresenceDetector(
	options: PresenceDetectorOptions
): PresenceDetectorResult {
	const { room, clientId, awareness, checkPresence, onCollaboratorDetected } =
		options;
	let timeoutId: ReturnType< typeof setTimeout > | null = null;
	let destroyed = false;
	let isActiveBrowser = document.visibilityState === 'visible';

	function handleVisibilityChange() {
		const wasActive = isActiveBrowser;
		isActiveBrowser = document.visibilityState === 'visible';

		// If tab becomes active again, poll immediately.
		if ( isActiveBrowser && ! wasActive && timeoutId ) {
			clearTimeout( timeoutId );
			timeoutId = null;
			poll();
		}
	}

	document.addEventListener( 'visibilitychange', handleVisibilityChange );

	async function poll(): Promise< void > {
		if ( destroyed ) {
			return;
		}

		try {
			const localState = awareness.getLocalState() ?? {};
			const result = await checkPresence( {
				room,
				clientId,
				localAwarenessState: localState as Record< string, unknown >,
			} );

			if ( destroyed ) {
				return;
			}

			if ( result.otherClientIds.length > 0 ) {
				// Another editor detected! Notify and stop polling.
				onCollaboratorDetected();
				destroy();
				return;
			}
		} catch {
			// Silently ignore errors — we'll retry on the next poll.
		}

		if ( ! destroyed ) {
			const interval = isActiveBrowser
				? PRESENCE_POLL_INTERVAL_MS
				: PRESENCE_POLL_INTERVAL_BACKGROUND_MS;
			timeoutId = setTimeout( poll, interval );
		}
	}

	function destroy(): void {
		destroyed = true;
		if ( timeoutId ) {
			clearTimeout( timeoutId );
			timeoutId = null;
		}
		document.removeEventListener(
			'visibilitychange',
			handleVisibilityChange
		);
	}

	// Start polling.
	poll();

	return { destroy };
}
