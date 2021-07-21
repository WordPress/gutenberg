/**
 * WordPress dependencies
 */
import { useResizeObserver } from '@wordpress/compose';
import { useRef, useLayoutEffect, useState } from '@wordpress/element';

/**
 * Positions an element by the top of an anchor element if it can fit or
 * otherwise as close as possible within the window.
 *
 * @param {Element} anchor       Element to take position from.
 * @param {Object}  $1           Options.
 * @param {boolean} $1.isEnabled Whether to apply the hook or not.
 *
 * @return {Object} A ref and resize observer element.
 */
export function useAlignTopWithinViewport( anchor, { isEnabled } ) {
	const ref = useRef();
	const anchorRef = useRef();
	const [
		{ start: boundsStart, end: boundsEnd } = {},
		setBounds,
	] = useState();
	const boundsUpdaterRef = useRef();

	const hasRef = !! ref.current;
	const hasAnchor = !! anchor;
	const anchorHasChanged = anchorRef.current !== anchor;
	anchorRef.current = anchor;

	// Defines the bounds updating function a single time
	if ( ! boundsUpdaterRef.current ) {
		boundsUpdaterRef.current = () => {
			const { defaultView } = ref.current.ownerDocument;
			setBounds( { start: 0, end: defaultView.innerHeight } );
		};
	}

	// Sets the bounds height and handles window resizes to update it
	useLayoutEffect( () => {
		if ( ! hasRef || ! isEnabled ) {
			return;
		}
		boundsUpdaterRef.current();
		const { defaultView } = ref.current.ownerDocument;
		const updateBounds = boundsUpdaterRef.current;
		defaultView.addEventListener( 'resize', updateBounds );
		return () => defaultView.removeEventListener( 'resize', updateBounds );
	}, [ hasRef, isEnabled ] );

	const [ resizeObserver, contentSize ] = useResizeObserver();

	// Handles scrolling, if needed, to update positioning
	useLayoutEffect( () => {
		if ( ! isEnabled || ! hasRef || ! hasAnchor ) {
			return;
		}
		// The element fills the bounds so scroll handling is not needed.
		// Positions it at the top of bounds and returns.
		if ( contentSize.height >= boundsEnd ) {
			ref.current.style.setProperty( '--align-top', '0px' );
			return;
		}
		const layout = () => {
			const anchorRect = anchorRef.current.getBoundingClientRect();
			let { top } = anchorRect;
			const height = contentSize.height;
			const bottom = top + height;
			if ( top < boundsStart || bottom > boundsEnd ) {
				const fromTop = Math.abs( boundsStart - top );
				const fromBottom = Math.abs( boundsEnd - bottom );
				top = fromTop < fromBottom ? boundsStart : boundsEnd - height;
			}
			ref.current.style.setProperty( '--align-top', top + 'px' );
		};
		layout();
		const { defaultView } = anchor.ownerDocument;
		const options = { capture: true, passive: true };
		defaultView.addEventListener( 'scroll', layout, options );
		return () => {
			defaultView.removeEventListener( 'scroll', layout, options );
		};
	}, [
		hasRef,
		anchorHasChanged,
		contentSize.height,
		boundsStart,
		boundsEnd,
		isEnabled,
	] );

	// Cleans up styles when not enabled
	useLayoutEffect( () => {
		if ( isEnabled && !! ref.current ) {
			const element = ref.current;
			return () => {
				element.style.removeProperty( '--align-top' );
			};
		}
	}, [ isEnabled ] );

	return { ref, resizeObserver };
}
