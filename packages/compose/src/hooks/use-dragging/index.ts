/**
 * WordPress dependencies
 */
import { useCallback, useEffect, useRef, useState } from '@wordpress/element';

/**
 * Internal dependencies
 */
import useIsomorphicLayoutEffect from '../use-isomorphic-layout-effect';
import type { DraggingProps, DraggingReturn } from './types';

/**
 * Hook to manage drag events with proper event handling
 *
 * @param props             Drag handlers
 * @param props.onDragStart
 * @param props.onDragMove
 * @param props.onDragEnd
 * @return Drag state and handlers
 */
export default function useDragging( {
	onDragStart,
	onDragMove,
	onDragEnd,
}: DraggingProps ): DraggingReturn {
	const [ isDragging, setIsDragging ] = useState( false );

	const eventsRef = useRef< DraggingProps >( {
		onDragStart,
		onDragMove,
		onDragEnd,
	} );
	useIsomorphicLayoutEffect( () => {
		eventsRef.current.onDragStart = onDragStart;
		eventsRef.current.onDragMove = onDragMove;
		eventsRef.current.onDragEnd = onDragEnd;
	}, [ onDragStart, onDragMove, onDragEnd ] );

	const onMouseMove = useCallback( ( event: MouseEvent ): void => {
		eventsRef.current.onDragMove?.( event );
	}, [] );

	const endDrag = useCallback(
		function endDrag( event?: MouseEvent ): void {
			eventsRef.current.onDragEnd?.( event );
			document.removeEventListener( 'mousemove', onMouseMove );
			document.removeEventListener( 'mouseup', endDrag );
			setIsDragging( false );
		},
		[ onMouseMove ]
	);

	const startDrag = useCallback(
		( event: React.MouseEvent ): void => {
			eventsRef.current.onDragStart?.( event );
			document.addEventListener( 'mousemove', onMouseMove );
			document.addEventListener( 'mouseup', endDrag );
			setIsDragging( true );
		},
		[ onMouseMove, endDrag ]
	);

	// Remove the global events when unmounting if needed.
	useEffect( () => {
		return () => {
			if ( isDragging ) {
				document.removeEventListener( 'mousemove', onMouseMove );
				document.removeEventListener( 'mouseup', endDrag );
			}
		};
	}, [ isDragging, onMouseMove, endDrag ] );

	return {
		startDrag,
		endDrag,
		isDragging,
	};
}
