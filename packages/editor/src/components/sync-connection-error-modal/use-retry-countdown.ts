/**
 * WordPress dependencies
 */
import { useState, useEffect, useRef } from '@wordpress/element';

interface ConnectionStatus {
	status: string;
	willAutoRetryInMs?: number;
}

export function useRetryCountdown(
	connectionStatus?: ConnectionStatus | null
): number | undefined {
	const [ secondsRemaining, setSecondsRemaining ] = useState< number >();
	const retryAtRef = useRef< number | null >( null );

	useEffect( () => {
		if ( ! connectionStatus ) {
			return;
		}

		const { status, willAutoRetryInMs: retryInMs } = connectionStatus;

		// Only clear countdown when explicitly connected.
		if ( status === 'connected' ) {
			setSecondsRemaining( undefined );
			retryAtRef.current = null;
			return;
		}

		// For transient states (e.g. 'connecting' during a retry attempt)
		// or when retryInMs is not yet available, keep the previous
		// countdown value to avoid a brief flash.
		if ( status !== 'disconnected' || ! retryInMs ) {
			return;
		}

		const retryAt = Date.now() + retryInMs;
		retryAtRef.current = retryAt;
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

	return secondsRemaining;
}
