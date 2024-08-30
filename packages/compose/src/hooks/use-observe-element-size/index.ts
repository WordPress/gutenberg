/**
 * WordPress dependencies
 */
import { useRef, useEffect } from '@wordpress/element';
/**
 * Internal dependencies
 */
import useEvent from '../use-event';

/**
 * Tracks a given element's size and calls `onUpdate` for all of its discrete
 * values using a `ResizeObserver`. The element can change dynamically and **it
 * must not be stored in a ref**. Instead, it should be stored in a React
 * state or equivalent.
 *
 * @param targetElement         The target element to observe. It can be changed dynamically.
 * @param onUpdate              Callback that will be called when the element is resized. It is passed the list of [`ResizeObserverEntry`](https://developer.mozilla.org/en-US/docs/Web/API/ResizeObserverEntry) objects passed to the `ResizeObserver.observe` callback internally, and the element being tracked at the time of this update.
 * @param resizeObserverOptions Options to pass to `ResizeObserver.observe` when called internally. Updating this option will not cause the observer to be re-created, and it will only take effect if a new element is observed.
 *
 * @example
 *
 * ```tsx
 * const [ targetElement, setTargetElement ] = useState< HTMLElement | null >();
 * useObserveElementSize(
 * 	targetElement,
 * 	( resizeObserverEntries, element ) => {
 * 		console.log( 'Resize observer entries:', resizeObserverEntries );
 * 		console.log( 'Element that was resized:', element );
 * 	},
 * 	{ box: 'border-box' }
 * );
 * <div ref={ setTargetElement } />;
 * ```
 */
export default function useObserveElementSize(
	/**
	 * The target element to observe. It can be changed dynamically.
	 */
	targetElement: HTMLElement | undefined | null,
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
		element: HTMLElement
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

	const observedElementRef = useRef< HTMLElement | null >();
	const resizeObserverRef = useRef< ResizeObserver >();

	// Options are passed on `.observe` once and never updated, so we store them
	// in an up-to-date ref to avoid unnecessary cycles of the effect due to
	// unstable option objects such as inlined literals.
	const resizeObserverOptionsRef = useRef( resizeObserverOptions );
	useEffect( () => {
		resizeObserverOptionsRef.current = resizeObserverOptions;
	}, [ resizeObserverOptions ] );

	// TODO: could/should this be a layout effect?
	useEffect( () => {
		if ( targetElement === observedElementRef.current ) {
			return;
		}

		observedElementRef.current = targetElement;

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
		if ( targetElement ) {
			resizeObserver.observe(
				targetElement,
				resizeObserverOptionsRef.current
			);
		}

		return () => {
			// Unobserve previous element.
			if ( observedElementRef.current ) {
				resizeObserver.unobserve( observedElementRef.current );
			}
		};
	}, [ onUpdateEvent, targetElement ] );
}
