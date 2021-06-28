/**
 * WordPress dependencies
 */
import {
	useRef,
	useEffect,
	useLayoutEffect,
	useState,
} from '@wordpress/element';
import { useResizeObserver } from '@wordpress/compose';

function getScrollContext( node ) {
	let at = node.parentNode;
	while ( at && at.clientHeight === at.scrollHeight ) {
		at = at.parentNode;
	}
	return at;
}

/**
 * Positions an element by the vertical edges of an objective element if it can
 * fit or otherwise as close as possible within the bounds of the objective’s
 * scrolling context.
 *
 * @param {Element} objective    Element to take position from.
 * @param {Object}  $1           Options.
 * @param {boolean} $1.isEnabled Whether to apply the hook or not.
 *
 * @return {Object} A ref and resize observer element.
 */
export function useBudgeYAxisBy( objective, { isEnabled } ) {
	const subjectRef = useRef();
	const objectiveRef = useRef();
	const scrollContextRef = useRef();
	const [ scrollBounds = {}, setScrollBounds ] = useState();
	const boundsUpdaterRef = useRef();

	const hasSubject = !! subjectRef.current;
	const hasObjective = !! objective;
	const objectiveHasChanged = objectiveRef.current !== objective;

	let scrollContextHasChanged;
	if ( objectiveHasChanged ) {
		objectiveRef.current = objective;
		const scrollContext = hasObjective
			? getScrollContext( objective )
			: null;
		scrollContextHasChanged = scrollContextRef.current !== scrollContext;
		scrollContextRef.current = scrollContext;
	}
	const hasScrollContext = !! scrollContextRef.current;

	// Defines the bounds updating function a single time
	if ( ! boundsUpdaterRef.current ) {
		boundsUpdaterRef.current = () => {
			const rect = scrollContextRef.current.getBoundingClientRect();
			subjectRef.current.style.maxHeight = rect.height + 'px';
			setScrollBounds( rect );
		};
	}

	// Handles window resizes to update scroll bounds
	useEffect( () => {
		if ( ! hasSubject || ! hasObjective || ! isEnabled ) {
			return;
		}
		const { defaultView } = objective.ownerDocument;
		const updateBounds = boundsUpdaterRef.current;
		defaultView.addEventListener( 'resize', updateBounds );
		return () => defaultView.removeEventListener( 'resize', updateBounds );
	}, [ hasObjective, hasSubject, isEnabled ] );

	// Handles mutations on the scrolling element to update scroll bounds
	useLayoutEffect( () => {
		if ( ! hasScrollContext || ! isEnabled ) {
			return;
		}
		boundsUpdaterRef.current();
		const { MutationObserver } = objective.ownerDocument.defaultView;
		const observer = new MutationObserver( boundsUpdaterRef.current );
		observer.observe( scrollContextRef.current, { attributes: true } );
		return () => observer.disconnect();
	}, [ scrollContextHasChanged, isEnabled ] );

	const [ resizeObserver, contentSize ] = useResizeObserver();

	// Handles scrolling, if needed, to update subject position
	useLayoutEffect( () => {
		if (
			! isEnabled ||
			! hasSubject ||
			! hasObjective ||
			! hasScrollContext
		) {
			return;
		}
		// The subject fills the bounds so scroll handling is not needed.
		// Positions subject at the top of bounds and returns.
		if ( contentSize.height >= scrollBounds.height ) {
			subjectRef.current.style.top = scrollBounds.top + 'px';
			return;
		}
		const layout = () => {
			const objectiveRect = objectiveRef.current.getBoundingClientRect();
			let { top } = objectiveRect;
			const height = contentSize.height;
			const bottom = top + height;
			const { bottom: boundsBottom, top: boundsTop } = scrollBounds;
			if ( top < boundsTop || bottom > boundsBottom ) {
				const fromTop = Math.abs( boundsTop - top );
				const fromBottom = Math.abs( boundsBottom - bottom );
				top = fromTop < fromBottom ? boundsTop : boundsBottom - height;
			}
			subjectRef.current.style.top = top + 'px';
		};
		layout();
		const scrollNode = scrollContextRef.current;
		const options = { passive: true };
		scrollNode.addEventListener( 'scroll', layout, options );
		return () => {
			scrollNode.removeEventListener( 'scroll', layout, options );
		};
	}, [
		hasSubject,
		hasScrollContext,
		objectiveHasChanged,
		contentSize.height,
		scrollBounds.height,
		scrollBounds.top,
		scrollBounds.bottom,
		isEnabled,
	] );

	// Cleans up subject styles when not enabled
	useLayoutEffect( () => {
		if ( isEnabled && !! subjectRef.current ) {
			const subject = subjectRef.current;
			return () => {
				subject.style.top = '';
				subject.style.maxHeight = '';
			};
		}
	}, [ isEnabled ] );

	return { ref: subjectRef, resizeObserver };
}
