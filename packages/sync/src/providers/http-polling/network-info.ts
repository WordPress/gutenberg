/**
 * Internal dependencies
 */
import { POLLING_INTERVAL_BACKGROUND_TAB_IN_MS } from './config';

type EffectiveConnectionType = 'slow-2g' | '2g' | '3g' | '4g';

interface NetworkInformationLike {
	effectiveType?: EffectiveConnectionType;
	addEventListener?: ( type: 'change', listener: () => void ) => void;
	removeEventListener?: ( type: 'change', listener: () => void ) => void;
}

interface NavigatorWithConnection extends Navigator {
	connection?: NetworkInformationLike;
}

function getNetworkInformation(): NetworkInformationLike | undefined {
	if ( typeof navigator === 'undefined' ) {
		return;
	}

	return ( navigator as NavigatorWithConnection ).connection;
}

function getIntervalMultiplier(
	effectiveType?: EffectiveConnectionType
): number {
	switch ( effectiveType ) {
		case '3g':
			return 4;
		case '2g':
		case 'slow-2g':
			return 10;
		default:
			return 1;
	}
}

/**
 * Slow active-tab polling on slower cellular links without exceeding the
 * background-tab interval. This keeps awareness updates below the server's
 * 30 second timeout while still reducing polling frequency substantially.
 *
 * @param baseInterval Base polling interval in milliseconds.
 * @return Network-aware polling interval in milliseconds.
 */
export function getNetworkAwarePollingInterval( baseInterval: number ): number {
	const connection = getNetworkInformation();

	if ( ! connection ) {
		return baseInterval;
	}

	return Math.min(
		baseInterval * getIntervalMultiplier( connection.effectiveType ),
		POLLING_INTERVAL_BACKGROUND_TAB_IN_MS
	);
}

/**
 * Subscribe to connection changes when the Network Information API is
 * available. Returns an unsubscribe callback when a listener is registered.
 *
 * @param listener Callback invoked when the connection type changes.
 * @return Unsubscribe callback, if supported.
 */
export function subscribeToNetworkChanges(
	listener: () => void
): ( () => void ) | undefined {
	const connection = getNetworkInformation();

	if ( ! connection?.addEventListener || ! connection.removeEventListener ) {
		return;
	}

	connection.addEventListener( 'change', listener );

	return () => connection.removeEventListener!( 'change', listener );
}
