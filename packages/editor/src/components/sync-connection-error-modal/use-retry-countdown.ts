/**
 * WordPress dependencies
 */
import type { ConnectionStatus } from '@wordpress/core-data';
import { useState, useEffect } from '@wordpress/element';

interface UseRetryCountdownResult {
	onManualRetry: () => void;
	secondsRemaining?: number;
}

export function useRetryCountdown(
	connectionStatus?: ConnectionStatus | null
): UseRetryCountdownResult {
	const [ secondsRemaining, setSecondsRemaining ] = useState< number >();

	useEffect( () => {
		if ( ! connectionStatus ) {
			return;
		}

		// Only clear countdown when explicitly connected.
		if ( 'connected' === connectionStatus.status ) {
			setSecondsRemaining( undefined );
			return;
		}

		// For transient states (e.g. 'connecting' during a retry attempt)
		// or when retryInMs is not yet available, keep the previous
		// countdown value to avoid a brief flash.
		if (
			'disconnected' !== connectionStatus.status ||
			! connectionStatus.willAutoRetryInMs
		) {
			return;
		}

		const { willAutoRetryInMs: retryInMs } = connectionStatus;
		const retryAt = Date.now() + retryInMs;
		setSecondsRemaining( Math.ceil( retryInMs / 1000 ) );

		const intervalId = setInterval( () => {
			const remaining = Math.ceil( ( retryAt - Date.now() ) / 1000 );
			setSecondsRemaining( Math.max( 0, remaining ) );
			if ( remaining <= 0 ) {
				clearInterval( intervalId );
			}
		}, 1000 );

		return () => clearInterval( intervalId );
	}, [ connectionStatus ] );

	return {
		onManualRetry: () => setSecondsRemaining( 0 ),
		secondsRemaining,
	};
}
