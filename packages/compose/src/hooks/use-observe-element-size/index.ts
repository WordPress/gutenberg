/**
 * External dependencies
 */
import type { RefObject } from 'react';
/**
 * WordPress dependencies
 */
import { useRef, useEffect, useLayoutEffect } from '@wordpress/element';
/**
 * Internal dependencies
 */
import useEvent from '../use-event';

/**
 * Tracks a given element's size and calls `onUpdate` for all of its discrete
 * values using a `ResizeObserver`. The element can change dynamically. Alternatively,
 * a ref containing the target element can be passed. However, any updates to the ref
 * will be ignored.
 *
 * @param targetElement         The target element to observe. It can be changed dynamically. Alternatively, a ref containing the target element can be passed. However, any updates to the ref will be ignored.
 * @param onUpdate              Callback that will be called when the element is resized. It is passed the list of [`ResizeObserverEntry`](https://developer.mozilla.org/en-US/docs/Web/API/ResizeObserverEntry) objects passed to the `ResizeObserver.observe` callback internally, and the element being tracked at the time of this update.
 * @param resizeObserverOptions Options to pass to `ResizeObserver.observe` when called internally. Updating this option will not cause the observer to be re-created, and it will only take effect if a new element is observed.
 *
 * @example
 *
 * ```tsx
 * const targetElementRef = useRef< HTMLElement >( null );
 * useObserveElementSize(
 * 	targetElementRef,
 * 	( resizeObserverEntries, element ) => {
 * 		console.log( 'Resize observer entries:', resizeObserverEntries );
 * 		console.log( 'Element that was resized:', element );
 * 	},
 * 	{ box: 'border-box' }
 * );
 * <div ref={ targetElementRef } />;
 *
 * // Alternatively, if the target element can change dynamically, you can pass it
 * // directly as a state:
 * const [ targetElement, setTargetElement ] = useState< HTMLElement | null >();
 * useObserveElementSize(
 * 	targetElement,
 * 	// ...
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
 */
export default function useObserveElementSize< T extends HTMLElement >(
	/**
	 * The target element to observe. It can be changed dynamically.
	 *
	 * Alternatively, a ref containing the target element can be passed. However, any updates
	 * to the ref will be ignored.
	 */
	targetElement: T | undefined | null | RefObject< T >,
	/**
	 * Callback that will be called when the element is resized.
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
	 * Options to pass to `ResizeObserver.observe` when called internally.
	 *
	 * Updating this option will not cause the observer to be re-created, and it
	 * will only take effect if a new element is observed.
	 */
	resizeObserverOptions?: ResizeObserverOptions
) {
	const onUpdateEvent = useEvent( onUpdate );

	const observedElementRef = useRef< T | null >();
	const resizeObserverRef = useRef< ResizeObserver >();

	// Options are passed on `.observe` once and never updated, so we store them
	// in an up-to-date ref to avoid unnecessary cycles of the effect due to
	// unstable option objects such as inlined literals.
	const resizeObserverOptionsRef = useRef( resizeObserverOptions );
	useEffect( () => {
		resizeObserverOptionsRef.current = resizeObserverOptions;
	}, [ resizeObserverOptions ] );

	useLayoutEffect( () => {
		const element =
			targetElement && 'current' in targetElement
				? targetElement?.current
				: targetElement;
		if ( element === observedElementRef.current ) {
			return;
		}

		observedElementRef.current = element;

		// Set up a ResizeObserver.
		if ( ! resizeObserverRef.current ) {
			resizeObserverRef.current = new ResizeObserver( ( entries ) => {
				if ( observedElementRef.current ) {
					onUpdateEvent( entries, observedElementRef.current );
				}
			} );
		}
		const { current: resizeObserver } = resizeObserverRef;

		// Observe new element.
		if ( element ) {
			resizeObserver.observe( element, resizeObserverOptionsRef.current );
		}

		return () => {
			// Unobserve previous element.
			if ( observedElementRef.current ) {
				resizeObserver.unobserve( observedElementRef.current );
			}
		};
	}, [ onUpdateEvent, targetElement ] );
}
