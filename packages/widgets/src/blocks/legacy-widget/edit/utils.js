/**
 * WordPress dependencies
 */
import { useRef, useLayoutEffect, useState } from '@wordpress/element';
import { useResizeObserver } from '@wordpress/compose';

/**
 * Positions an element by the top of an objective element if it can fit or
 * otherwise as close as possible within the window.
 *
 * @param {Element} objective    Element to take position from.
 * @param {Object}  $1           Options.
 * @param {boolean} $1.isEnabled Whether to apply the hook or not.
 *
 * @return {Object} A ref and resize observer element.
 */
export function useBudgeTopBy( objective, { isEnabled } ) {
	const subjectRef = useRef();
	const objectiveRef = useRef();
	const [
		{ start: boundsStart, end: boundsEnd } = {},
		setBounds,
	] = useState();
	const boundsUpdaterRef = useRef();

	const hasSubject = !! subjectRef.current;
	const hasObjective = !! objective;
	const objectiveHasChanged = objectiveRef.current !== objective;
	objectiveRef.current = objective;

	// Defines the bounds updating function a single time
	if ( ! boundsUpdaterRef.current ) {
		boundsUpdaterRef.current = () => {
			const { defaultView } = subjectRef.current.ownerDocument;
			setBounds( { start: 0, end: defaultView.innerHeight } );
		};
	}

	// Sets the bounds height and handles window resizes to update it
	useLayoutEffect( () => {
		if ( ! hasSubject || ! hasObjective || ! isEnabled ) {
			return;
		}
		boundsUpdaterRef.current();
		const { defaultView } = objective.ownerDocument;
		const updateBounds = boundsUpdaterRef.current;
		defaultView.addEventListener( 'resize', updateBounds );
		return () => defaultView.removeEventListener( 'resize', updateBounds );
	}, [ hasObjective, hasSubject, isEnabled ] );

	const [ resizeObserver, contentSize ] = useResizeObserver();

	// Handles scrolling, if needed, to update subject position
	useLayoutEffect( () => {
		if ( ! isEnabled || ! hasSubject || ! hasObjective ) {
			return;
		}
		// The subject fills the bounds so scroll handling is not needed.
		// Positions subject at the top of bounds and returns.
		if ( contentSize.height >= boundsEnd ) {
			// subjectRef.current.style.top = '0px';
			subjectRef.current.style.setProperty( '--budge-top', '0px' );
			return;
		}
		const layout = () => {
			const objectiveRect = objectiveRef.current.getBoundingClientRect();
			let { top } = objectiveRect;
			const height = contentSize.height;
			const bottom = top + height;
			if ( top < boundsStart || bottom > boundsEnd ) {
				const fromTop = Math.abs( boundsStart - top );
				const fromBottom = Math.abs( boundsEnd - bottom );
				top = fromTop < fromBottom ? boundsStart : boundsEnd - height;
			}
			subjectRef.current.style.setProperty( '--budge-top', top + 'px' );
		};
		layout();
		const { defaultView } = objective.ownerDocument;
		const options = { capture: true, passive: true };
		defaultView.addEventListener( 'scroll', layout, options );
		return () => {
			defaultView.removeEventListener( 'scroll', layout, options );
		};
	}, [
		hasSubject,
		objectiveHasChanged,
		contentSize.height,
		boundsStart,
		boundsEnd,
		isEnabled,
	] );

	// Cleans up subject styles when not enabled
	useLayoutEffect( () => {
		if ( isEnabled && !! subjectRef.current ) {
			const subject = subjectRef.current;
			return () => {
				subject.style.removeProperty( '--budge-top' );
			};
		}
	}, [ isEnabled ] );

	return { ref: subjectRef, resizeObserver };
}
