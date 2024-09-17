/**
 * WordPress dependencies
 */
import { useRef } from '@wordpress/element';
/**
 * Internal dependencies
 */
import useEvent from '../use-event';
import type { ObservedSize } from './legacy';
import _useLegacyResizeObserver from './legacy';
/**
 * External dependencies
 */
import type { ReactElement } from 'react';

// This is the current implementation of `useResizeObserver`.
//
// The legacy implementation is still supported for backwards compatibility.
// This is achieved by overloading the exported function with both signatures,
// and detecting which API is being used at runtime.
function _useResizeObserver< T extends HTMLElement >(
	callback: ResizeObserverCallback,
	resizeObserverOptions: ResizeObserverOptions = {}
): ( element?: T | null ) => void {
	const callbackEvent = useEvent( callback );

	const observedElementRef = useRef< T | null >();
	const resizeObserverRef = useRef< ResizeObserver >();
	return useEvent( ( element?: T | null ) => {
		if ( element === observedElementRef.current ) {
			return;
		}
		observedElementRef.current = element;

		// Set up `ResizeObserver`.
		resizeObserverRef.current ??= new ResizeObserver( callbackEvent );
		const { current: resizeObserver } = resizeObserverRef;

		// Unobserve previous element.
		if ( observedElementRef.current ) {
			resizeObserver.unobserve( observedElementRef.current );
		}

		// Observe new element.
		if ( element ) {
			resizeObserver.observe( element, resizeObserverOptions );
		}
	} );
}

/**
 * Sets up a [`ResizeObserver`](https://developer.mozilla.org/en-US/docs/Web/API/Resize_Observer_API)
 * for an HTML or SVG element.
 *
 * Pass the returned setter as a callback ref to the React element you want
 * to observe, or use it in layout effects for advanced use cases.
 *
 * @example
 *
 * ```tsx
 * const setElement = useResizeObserver(
 * 	( resizeObserverEntries ) => console.log( resizeObserverEntries ),
 * 	{ box: 'border-box' }
 * );
 * <div ref={ setElement } />;
 *
 * // The setter can be used in other ways, for example:
 * useLayoutEffect( () => {
 * 	setElement( document.querySelector( `data-element-id="${ elementId }"` ) );
 * }, [ elementId ] );
 * ```
 *
 * @param callback The `ResizeObserver` callback - [MDN docs](https://developer.mozilla.org/en-US/docs/Web/API/ResizeObserver/ResizeObserver#callback).
 * @param options  Options passed to `ResizeObserver.observe` when called - [MDN docs](https://developer.mozilla.org/en-US/docs/Web/API/ResizeObserver/observe#options). Changes will be ignored.
 */
export default function useResizeObserver< T extends Element >(
	/**
	 * The `ResizeObserver` callback - [MDN docs](https://developer.mozilla.org/en-US/docs/Web/API/ResizeObserver/ResizeObserver#callback).
	 */
	callback: ResizeObserverCallback,
	/**
	 * Options passed to `ResizeObserver.observe` when called - [MDN docs](https://developer.mozilla.org/en-US/docs/Web/API/ResizeObserver/observe#options). Changes will be ignored.
	 */
	options?: ResizeObserverOptions
): ( element?: T | null ) => void;

/**
 * **This is a legacy API and should not be used.**
 *
 * @deprecated Use the other `useResizeObserver` API instead: `const ref = useResizeObserver( ( entries ) => { ... } )`.
 *
 * Hook which allows to listen to the resize event of any target element when it changes size.
 * _Note: `useResizeObserver` will report `null` sizes until after first render.
 *
 * @example
 *
 * ```js
 * const App = () => {
 * 	const [ resizeListener, sizes ] = useResizeObserver();
 *
 * 	return (
 * 		<div>
 * 			{ resizeListener }
 * 			Your content here
 * 		</div>
 * 	);
 * };
 * ```
 */
export default function useResizeObserver(): [ ReactElement, ObservedSize ];

export default function useResizeObserver< T extends HTMLElement >(
	callback?: ResizeObserverCallback,
	options: ResizeObserverOptions = {}
): ( ( element?: T | null ) => void ) | [ ReactElement, ObservedSize ] {
	return callback
		? _useResizeObserver( callback, options )
		: _useLegacyResizeObserver();
}
