/**
 * External dependencies
 */
import { noop } from 'lodash';
import { useDrag } from 'react-use-gesture';

/**
 * WordPress dependencies
 */
import { useCallback, useEffect, useState } from '@wordpress/element';

/**
 * Internal dependencies
 */
import type { DragAxis } from '../types';
import { clearSelection } from '../../utils/clear-selection';
import { useCx } from '../../utils/hooks';

import * as styles from '../styles';

export interface UseBaseDragHandlersProps {
	increment?: ( n?: number ) => void;
	decrement?: ( n?: number ) => void;
	isTypeNumeric?: boolean;
	dragAxis?: DragAxis;
}

export function useBaseDragHandlers( {
	decrement = noop,
	dragAxis,
	increment = noop,
	isTypeNumeric = true,
}: UseBaseDragHandlersProps ) {
	const [ dragState, setDragState ] = useState< DragAxis | undefined >(
		undefined
	);
	const threshold = 10;

	const cx = useCx();

	useEffect( () => {
		if ( dragState ) {
			clearSelection();

			if ( dragState === 'x' ) {
				document.documentElement.classList.add(
					cx( styles.globalDraggableX )
				);
				document.documentElement.classList.remove(
					cx( styles.globalDraggableY )
				);
			} else {
				document.documentElement.classList.remove(
					cx( styles.globalDraggableX )
				);
				document.documentElement.classList.add(
					cx( styles.globalDraggableY )
				);
			}
		} else {
			document.documentElement.classList.remove(
				cx( styles.globalDraggableX )
			);
			document.documentElement.classList.remove(
				cx( styles.globalDraggableY )
			);
		}
	}, [ dragState ] );

	const dragGestures = useDrag(
		( state ) => {
			const [ x, y ] = state.delta;
			setDragState( state.dragging ? state.axis : undefined );

			const isMovementY = state.axis === 'y';
			const movement = isMovementY ? y * -1 : x;

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

	const handleOnMouseUp = useCallback( () => setDragState( undefined ), [] );

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
	} as const;

	return gestures;
}
