/**
 * WordPress dependencies
 */
import type { ConnectionStatus } from '@wordpress/core-data';
import { useState, useEffect, useRef } from '@wordpress/element';

interface UseRetryCountdownResult {
	onManualRetry: () => void;
	secondsRemaining?: number;
}

export function useRetryCountdown(
	connectionStatus?: ConnectionStatus | null
): UseRetryCountdownResult {
	const [ secondsRemaining, setSecondsRemaining ] = useState< number >();
	const hasRetriedRef = useRef( false );

	useEffect( () => {
		if ( ! connectionStatus ) {
			return;
		}

		// Only clear countdown when explicitly connected.
		if ( 'connected' === connectionStatus.status ) {
			setSecondsRemaining( undefined );
			hasRetriedRef.current = false;
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

		// After a retry attempt (manual or automatic), show "Retrying..."
		// for 500ms before starting the next countdown. Skip the delay on
		// the very first disconnect so the countdown starts immediately.
		const hasRetried = hasRetriedRef.current;
		hasRetriedRef.current = true;

		if ( hasRetried ) {
			setSecondsRemaining( 0 );
		}

		let countdownIntervalId: ReturnType< typeof setInterval > | null = null;

		const startCountdown = () => {
			setSecondsRemaining( Math.ceil( ( retryAt - Date.now() ) / 1000 ) );

			countdownIntervalId = setInterval( () => {
				const remaining = Math.ceil( ( retryAt - Date.now() ) / 1000 );
				setSecondsRemaining( Math.max( 0, remaining ) );

				if ( remaining <= 0 && countdownIntervalId ) {
					clearInterval( countdownIntervalId );
				}
			}, 1000 );
		};

		const retryingDelayId = hasRetried
			? setTimeout( startCountdown, 500 )
			: null;

		if ( ! retryingDelayId ) {
			startCountdown();
		}

		return () => {
			if ( retryingDelayId ) {
				clearTimeout( retryingDelayId );
			}

			if ( countdownIntervalId ) {
				clearInterval( countdownIntervalId );
			}
		};
	}, [ connectionStatus ] );

	return {
		onManualRetry: () => {
			setSecondsRemaining( 0 );
		},
		secondsRemaining,
	};
}
