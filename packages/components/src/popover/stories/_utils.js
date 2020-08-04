/**
 * WordPress dependencies
 */
import { useCallback, useEffect, useState } from '@wordpress/element';

export const DraggableWrapper = (
	props = { role: 'presentation', style: {} }
) => {
	const { role, style, ...restProps } = props;
	const [ position, setPosition ] = useState( { x: 0, y: 0 } );
	const [ isDragging, setDragging ] = useState( false );

	const updatePosition = useCallback(
		( event ) => {
			if ( ! isDragging ) {
				return false;
			}
			const { movementX, movementY } = event;
			setPosition( {
				...position,
				x: position.x + movementX,
				y: position.y + movementY,
			} );
		},
		[ isDragging, position ]
	);

	const startDragging = useCallback( () => setDragging( true ), [] );
	const stopDragging = useCallback( () => setDragging( false ), [] );

	useEffect( () => {
		document.addEventListener( 'mousemove', updatePosition );
		document.addEventListener( 'mouseup', stopDragging );
		return () => {
			document.removeEventListener( 'mousemove', updatePosition );
			document.removeEventListener( 'mouseup', stopDragging );
		};
	}, [ updatePosition, stopDragging ] );

	const { x, y } = position;

	/**
	 * Ideally, the x and y coordinates would be applied transform: translate.
	 * However, using transform is causing layout rendering issues when
	 * combined with components like Popover (due to their positioning
	 * strategy).
	 */
	const componentStyle = {
		...style,
		position: 'relative',
		top: y,
		left: x,
	};

	return (
		<div
			{ ...restProps }
			onMouseUp={ stopDragging }
			onMouseDown={ startDragging }
			role={ role }
			style={ componentStyle }
		/>
	);
};
