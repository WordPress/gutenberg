/**
 * WordPress dependencies
 */
import { useCallback, useEffect, useRef, useState } from '@wordpress/element';

/**
 * Internal dependencies
 */
import useIsomorphicLayoutEffect from '../use-isomorphic-layout-effect';

// Event handlers that are triggered from `document` listeners accept a MouseEvent,
// while those triggered from React listeners accept a React.MouseEvent.
/**
 * @param {Object}                                  props
 * @param {(e: import('react').MouseEvent) => void} props.onDragStart
 * @param {(e: MouseEvent) => void}                 props.onDragMove
 * @param {(e?: MouseEvent) => void}                props.onDragEnd
 */
export default function useDragging( { onDragStart, onDragMove, onDragEnd } ) {
	const [ isDragging, setIsDragging ] = useState( false );

	const eventsRef = useRef( {
		onDragStart,
		onDragMove,
		onDragEnd,
	} );
	useIsomorphicLayoutEffect( () => {
		eventsRef.current.onDragStart = onDragStart;
		eventsRef.current.onDragMove = onDragMove;
		eventsRef.current.onDragEnd = onDragEnd;
	}, [ onDragStart, onDragMove, onDragEnd ] );

	/** @type {(e: MouseEvent) => void} */
	const onMouseMove = useCallback(
		( event ) =>
			eventsRef.current.onDragMove &&
			eventsRef.current.onDragMove( event ),
		[]
	);
	/** @type {(e?: MouseEvent) => void} */
	const endDrag = useCallback( ( event ) => {
		if ( eventsRef.current.onDragEnd ) {
			eventsRef.current.onDragEnd( event );
		}
		document.removeEventListener( 'mousemove', onMouseMove );
		document.removeEventListener( 'mouseup', endDrag );
		setIsDragging( false );
	}, [] );
	/** @type {(e: import('react').MouseEvent) => void} */
	const startDrag = useCallback( ( event ) => {
		if ( eventsRef.current.onDragStart ) {
			eventsRef.current.onDragStart( event );
		}
		document.addEventListener( 'mousemove', onMouseMove );
		document.addEventListener( 'mouseup', endDrag );
		setIsDragging( true );
	}, [] );

	// Remove the global events when unmounting if needed.
	useEffect( () => {
		return () => {
			if ( isDragging ) {
				document.removeEventListener( 'mousemove', onMouseMove );
				document.removeEventListener( 'mouseup', endDrag );
			}
		};
	}, [ isDragging ] );

	return {
		startDrag,
		endDrag,
		isDragging,
	};
}
