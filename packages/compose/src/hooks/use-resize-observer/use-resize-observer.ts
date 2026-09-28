import { useEffect, useRef } from '@wordpress/element';
import useEvent from '../use-event';

// This is the current implementation of `useResizeObserver`.
//
// The legacy implementation is still supported for backwards compatibility.
// This is achieved by overloading the exported function with both signatures,
// and detecting which API is being used at runtime.
export function useResizeObserver< T extends HTMLElement >(
	callback: ResizeObserverCallback,
	resizeObserverOptions: ResizeObserverOptions = {}
): ( element?: T | null ) => void {
	const callbackEvent = useEvent( callback );

	const observedElementRef = useRef< T | null >( null );
	const resizeObserverRef = useRef< ResizeObserver >( undefined );
	useEffect( () => {
		if ( observedElementRef.current ) {
			resizeObserverRef.current?.observe(
				observedElementRef.current,
				resizeObserverOptions
			);
		}
		return () => resizeObserverRef.current?.disconnect();
		// This effect owns the observer lifecycle. The returned ref handles
		// element and option changes without recreating the observer.
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [] );
	return useEvent( ( element?: T | null ) => {
		if ( element === observedElementRef.current ) {
			return;
		}

		// Set up `ResizeObserver`.
		resizeObserverRef.current ??= new ResizeObserver( callbackEvent );
		const { current: resizeObserver } = resizeObserverRef;

		// Unobserve previous element.
		if ( observedElementRef.current ) {
			resizeObserver.unobserve( observedElementRef.current );
		}

		// Observe new element.
		observedElementRef.current = element ?? null;
		if ( element ) {
			resizeObserver.observe( element, resizeObserverOptions );
		}
	} );
}
