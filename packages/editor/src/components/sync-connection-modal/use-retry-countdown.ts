/**
 * WordPress dependencies
 */
import { useState, useEffect, useRef } from '@wordpress/element';

const MIN_RETRYING_DISPLAY_MS = 600;

type ConnectionStatus = 'connected' | 'disconnected' | 'connecting';

export function useRetryCountdown(
	retryInMs: number | undefined,
	status: ConnectionStatus | undefined
): { secondsRemaining: number | null; markRetrying: () => void } {
	const [ secondsRemaining, setSecondsRemaining ] = useState< number | null >(
		null
	);
	const [ isRetrying, setIsRetrying ] = useState( false );
	const retryAtRef = useRef< number | null >( null );

	// Show "Retrying…" for a minimum duration when manually triggered.
	const markRetrying = () => setIsRetrying( true );

	useEffect( () => {
		if ( ! isRetrying ) {
			return;
		}
		const id = setTimeout(
			() => setIsRetrying( false ),
			MIN_RETRYING_DISPLAY_MS
		);
		return () => clearTimeout( id );
	}, [ isRetrying ] );

	useEffect( () => {
		// Only clear countdown when explicitly connected.
		if ( status === 'connected' ) {
			setSecondsRemaining( null );
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
				setIsRetrying( true );
			}
		}, 1000 );

		return () => clearInterval( intervalId );
	}, [ retryInMs, status ] );

	const displaySeconds = isRetrying ? 0 : secondsRemaining;

	return { secondsRemaining: displaySeconds, markRetrying };
}
