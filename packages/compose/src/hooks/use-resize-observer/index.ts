/**
 * Internal dependencies
 */
import { useResizeObserver as _useResizeObserver } from './use-resize-observer';
import type { ObservedSize } from './legacy';
import _useLegacyResizeObserver from './legacy';
/**
 * External dependencies
 */
import type { ReactElement } from 'react';

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
