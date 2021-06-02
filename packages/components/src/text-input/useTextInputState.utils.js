import { clearSelection } from '@wp-g2/utils';
import { noop } from 'lodash';
import { useCallback, useEffect, useState } from 'react';
import { useDrag } from 'react-use-gesture';

import * as styles from './styles';

export function useBaseDragHandlers( {
	decrement,
	dragAxis,
	increment,
	isTypeNumeric = true,
} ) {
	const [ dragState, setDragState ] = useState(
		/** @type {undefined | 'x' | 'y'} */ ( undefined )
	);
	const threshold = 10;

	useEffect( () => {
		if ( dragState ) {
			clearSelection();

			if ( dragState === 'x' ) {
				document.documentElement.classList.add(
					styles.globalDraggableX
				);
				document.documentElement.classList.remove(
					styles.globalDraggableY
				);
			} else {
				document.documentElement.classList.remove(
					styles.globalDraggableX
				);
				document.documentElement.classList.add(
					styles.globalDraggableY
				);
			}
		} else {
			document.documentElement.classList.remove(
				styles.globalDraggableX
			);
			document.documentElement.classList.remove(
				styles.globalDraggableY
			);
		}
	}, [ dragState ] );

	const dragGestures = useDrag(
		( state ) => {
			const [ x, y ] = state.delta;
			setDragState( state.dragging ? state.axis : undefined );

			const isMovementY = state.axis === 'y';
			let movement = isMovementY ? y * -1 : x;

			if ( Math.abs( movement ) === 0 ) return;

			const shouldIncrement = movement > 0;

			let boost = movement === threshold ? 0 : movement;
			boost = shouldIncrement ? boost : boost * -1;
			boost = boost - 1;

			if ( shouldIncrement ) {
				increment( boost );
			} else {
				decrement( boost );
			}
		},
		{ axis: dragAxis, threshold }
	);

	const handleOnMouseUp = useCallback( () => setDragState( false ), [] );

	const baseGestures = isTypeNumeric
		? dragGestures()
		: {
				onPointerDown: noop,
				onPointerMove: noop,
				onPointerUp: noop,
				onPointerCancel: noop,
		  };

	const gestures = {
		...baseGestures,
		onMouseUp: handleOnMouseUp,
	};

	return gestures;
}
