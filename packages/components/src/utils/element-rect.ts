/* eslint-disable jsdoc/require-param */
/**
 * WordPress dependencies
 */
import { useRef, useEffect, useState } from '@wordpress/element';
/**
 * Internal dependencies
 */
import { useEvent } from './hooks/use-event';

/**
 * `useTrackElementRectUpdates` options.
 */
export type UseTrackElementRectUpdatesOptions = {
	/**
	 * Whether to trigger the callback when an element's ResizeObserver is
	 * first set up, including when the target element changes.
	 *
	 * @default true
	 */
	fireOnElementInit?: boolean;
};

/**
 * Tracks a given element's size and calls `onUpdate` for all of its discrete
 * values using a `ResizeObserver`. The element can change dynamically and **it
 * must not be stored in a ref**. Instead, it should be stored in a React
 * state or equivalent.
 *
 * @example
 *
 * ```tsx
 * const [ targetElement, setTargetElement ] = useState< HTMLElement | null >();
 * useResizeObserver( targetElement, ( resizeObserverEntries, element, { box: "border-box" } ) => {
 *   console.log( 'Resize observer entries:', resizeObserverEntries );
 *   console.log( 'Element that was resized:', element );
 * } );
 * <div ref={ setTargetElement } />;
 * ```
 */
export function useResizeObserver(
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

/**
 * The position and dimensions of an element, relative to its offset parent.
 */
export type ElementOffsetRect = {
	/**
	 * The distance from the left edge of the offset parent to the left edge of
	 * the element.
	 */
	left: number;
	/**
	 * The distance from the top edge of the offset parent to the top edge of
	 * the element.
	 */
	top: number;
	/**
	 * The width of the element.
	 */
	width: number;
	/**
	 * The height of the element.
	 */
	height: number;
};

/**
 * An `ElementOffsetRect` object with all values set to zero.
 */
export const NULL_ELEMENT_OFFSET_RECT = {
	left: 0,
	top: 0,
	width: 0,
	height: 0,
} satisfies ElementOffsetRect;

/**
 * Returns the position and dimensions of an element, relative to its offset
 * parent, with subpixel precision. Values reflect the real measures before any
 * potential scaling distortions along the X and Y axes.
 *
 * Useful in contexts where plain `getBoundingClientRect` calls or `ResizeObserver`
 * entries are not suitable, such as when the element is transformed, and when
 * `element.offset<Top|Left|Width|Height>` methods are not precise enough.
 */
export function getElementOffsetRect(
	element: HTMLElement
): ElementOffsetRect {
	// Position and dimension values computed with `getBoundingClientRect` have
	// subpixel precision, but are affected by distortions since they represent
	// the "real" measures, or in other words, the actual final values as rendered
	// by the browser.
	const rect = element.getBoundingClientRect();
	const offsetParentRect =
		element.offsetParent?.getBoundingClientRect() ??
		NULL_ELEMENT_OFFSET_RECT;

	// Computed widths and heights have subpixel precision, and are not affected
	// by distortions.
	const computedWidth = parseFloat( getComputedStyle( element ).width );
	const computedHeight = parseFloat( getComputedStyle( element ).height );

	// We can obtain the current scale factor for the element by comparing "computed"
	// dimensions with the "real" ones.
	const scaleX = computedWidth / rect.width;
	const scaleY = computedHeight / rect.height;

	return {
		// To obtain the right values for the position:
		// 1. Compute the element's position relative to the offset parent.
		// 2. Correct for the scale factor.
		left: ( rect.left - offsetParentRect?.left ) * scaleX,
		top: ( rect.top - offsetParentRect?.top ) * scaleY,
		// Computed dimensions don't need any adjustments.
		width: computedWidth,
		height: computedHeight,
	};
}

/**
 * Tracks the position and dimensions of an element, relative to its offset
 * parent. The element can be changed dynamically.
 */
export function useTrackElementOffsetRect(
	targetElement: HTMLElement | undefined | null
) {
	const [ indicatorPosition, setIndicatorPosition ] =
		useState< ElementOffsetRect >( NULL_ELEMENT_OFFSET_RECT );

	useResizeObserver( targetElement, ( _, element ) =>
		setIndicatorPosition( getElementOffsetRect( element ) )
	);

	return indicatorPosition;
}

/* eslint-enable jsdoc/require-param */
