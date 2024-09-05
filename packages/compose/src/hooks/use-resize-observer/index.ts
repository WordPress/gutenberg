/**
 * WordPress dependencies
 */
import { useRef, useLayoutEffect } from '@wordpress/element';
/**
 * Internal dependencies
 */
import useEvent from '../use-event';

/** `useResizeObserver` options. */
export type ObserveElementSizeOptions< T extends HTMLElement > =
	ResizeObserverOptions & {
		/**
		 * The target element to observe. This parameter is an alternative to the
		 * returned ref. The element can be changed dynamically.
		 */
		targetElement?: T | undefined | null;
	};

/**
 * Tracks a given element's size and calls `onUpdate` for all of its discrete
 * values using a `ResizeObserver`. Pass the returned ref to the element or
 * pass the element to the `targetElement` option directly.
 *
 * @example
 *
 * ```tsx
 * const targetElementRef = useResizeObserver(
 * 	( resizeObserverEntries, element ) => {
 * 		console.log( 'Resize observer entries:', resizeObserverEntries );
 * 		console.log( 'Element that was measured:', element );
 * 	},
 * 	{ box: 'border-box' }
 * );
 * <div ref={ targetElementRef } />;
 *
 * // Alternatively, pass the element directly as an argument:
 * const [ targetElement, setTargetElement ] = useState< HTMLElement | null >();
 * useResizeObserver(
 * 	// ...
 * 	{
 * 		targetElement,
 * 		// ...
 * 	}
 * );
 * <div ref={ setTargetElement } />;
 *
 * // The element could be obtained through other means, for example:
 * useEffect( () => {
 * 	const element = document.querySelector(
 * 		`[data-element-id="${ elementId }"]`
 * 	);
 * 	setTargetElement( element );
 * }, [ elementId ] );
 * ```
 *
 * @param onUpdate                            Callback that will be called when the element is measured (initially and after resizes).
 * @param resizeObserverOptions               Options that, with the exception of `targetElement`, will be passed to `ResizeObserver.observe` when called internally. Updating them will not cause the observer to be re-created, and they will only take effect if a new element is observed.
 * @param resizeObserverOptions.targetElement The target element to observe. This parameter is an alternative to the returned ref. The element can be changed dynamically.
 */
export default function useResizeObserver< T extends HTMLElement >(
	/**
	 * Callback that will be called when the element is measured (initially and
	 * after resizes).
	 */
	onUpdate: (
		/**
		 * The list of
		 * [`ResizeObserverEntry`](https://developer.mozilla.org/en-US/docs/Web/API/ResizeObserverEntry)
		 * objects passed to the `ResizeObserver.observe` callback internally.
		 */
		resizeObserverEntries: ResizeObserverEntry[],
		/**
		 * The element being tracked at the time of this update.
		 */
		element: T
	) => void,
	/**
	 * Options that, with the exception of `targetElement`, will be passed to
	 * `ResizeObserver.observe` when called internally.
	 *
	 * Updating them will not cause the observer to be re-created, and they will
	 * only take effect if a new element is observed.
	 */
	{
		targetElement,
		...resizeObserverOptions
	}: ObserveElementSizeOptions< T > = {}
): ( element?: T | null | undefined ) => void {
	const onUpdateEvent = useEvent( onUpdate );

	const observedElementRef = useRef< T | null >();
	const resizeObserverRef = useRef< ResizeObserver >();
	const setElement = useEvent( ( element?: T | null | undefined ) => {
		if ( element === observedElementRef.current ) {
			return;
		}
		observedElementRef.current = element;

		// Set up `ResizeObserver`.
		if ( ! resizeObserverRef.current ) {
			resizeObserverRef.current = new ResizeObserver( ( entries ) => {
				if ( observedElementRef.current ) {
					onUpdateEvent( entries, observedElementRef.current );
				}
			} );
		}
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

	// Handle `targetElement` option.
	const isArgumentRef = useRef( Boolean( targetElement ) );
	useLayoutEffect( () => {
		if ( targetElement || isArgumentRef.current ) {
			isArgumentRef.current = true;
			setElement( targetElement );
			return setElement;
		}
		return undefined;
	}, [ setElement, targetElement ] );

	return setElement;
}
