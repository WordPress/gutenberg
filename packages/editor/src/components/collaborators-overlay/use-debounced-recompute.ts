import { useCallback, useEffect, useRef, useState } from '@wordpress/element';

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

/**
 * Returns a recompute token and a callback that bumps it on the next
 * animation frame. Successive calls within the same frame are coalesced.
 * Use this for resize-triggered recomputes so the DOM is measured after
 * the browser has finished layout, without an arbitrary fixed delay.
 *
 * @return A tuple of [recomputeToken, rerenderOnNextFrame].
 */
export function useRequestAnimationFrameRecompute(): [ number, () => void ] {
	const [ recomputeToken, setRecomputeToken ] = useState( 0 );
	const requestAnimationFrameRef = useRef< number | null >( null );

	useEffect( () => {
		return () => {
			if ( requestAnimationFrameRef.current !== null ) {
				cancelAnimationFrame( requestAnimationFrameRef.current );
			}
		};
	}, [] );

	const rerenderOnNextFrame = useCallback( () => {
		if ( requestAnimationFrameRef.current !== null ) {
			cancelAnimationFrame( requestAnimationFrameRef.current );
		}
		requestAnimationFrameRef.current = requestAnimationFrame( () => {
			requestAnimationFrameRef.current = null;
			setRecomputeToken( ( t ) => t + 1 );
		} );
	}, [] );

	return [ recomputeToken, rerenderOnNextFrame ];
}
