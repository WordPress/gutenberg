import { useCallback, useRef, useState } from '@wordpress/element';

/**
 * Returns a recompute token and a debounced callback that bumps it.
 * Rapid successive calls cancel the previous pending timeout so only one
 * recompute fires, `delayMs` after the last call.
 *
 * @param delayMs - Milliseconds to wait before bumping the recompute token.
 * @return A tuple of [recomputeToken, rerenderAfterDelay].
 */
export function useDebouncedRecompute(
	delayMs: number
): [ number, () => () => void ] {
	const [ recomputeToken, setRecomputeToken ] = useState( 0 );
	const timeoutRef = useRef< ReturnType< typeof setTimeout > | null >( null );

	const rerenderAfterDelay = useCallback( () => {
		if ( timeoutRef.current ) {
			clearTimeout( timeoutRef.current );
		}
		timeoutRef.current = setTimeout( () => {
			setRecomputeToken( ( t ) => t + 1 );
		}, delayMs );
		return () => {
			if ( timeoutRef.current ) {
				clearTimeout( timeoutRef.current );
			}
		};
	}, [ delayMs ] );

	return [ recomputeToken, rerenderAfterDelay ];
}
