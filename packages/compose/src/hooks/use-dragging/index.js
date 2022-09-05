/**
 * WordPress dependencies
 */
import { useCallback, useEffect, useRef, useState } from '@wordpress/element';

/**
 * Internal dependencies
 */
import useIsomorphicLayoutEffect from '../use-isomorphic-layout-effect';

/**
 * @param {Object}                              props
 * @param {import('react').MouseEventHandler}   props.onDragStart
 * @param {(e: MouseEvent) => void}             props.onDragMove
 * @param {(e: MouseEvent | undefined) => void} props.onDragEnd
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

	const onMouseMove = useCallback(
		( /** @type {MouseEvent} */ event ) =>
			eventsRef.current.onDragMove &&
			eventsRef.current.onDragMove( event ),
		[]
	);
	const endDrag = useCallback(
		( /** @type {MouseEvent=} */ event = undefined ) => {
			if ( eventsRef.current.onDragEnd ) {
				eventsRef.current.onDragEnd( event );
			}
			document.removeEventListener( 'mousemove', onMouseMove );
			document.removeEventListener( 'mouseup', endDrag );
			setIsDragging( false );
		},
		[]
	);
	/** @type {import('react').MouseEventHandler} */
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
