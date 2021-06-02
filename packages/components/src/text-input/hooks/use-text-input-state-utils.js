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

import { clearSelection } from '../../utils/clear-selection';

import * as styles from '../styles';

/**
 * @typedef Props
 * @property {(int: number|undefined) => void} [increment] Increment text input number value callback.
 * @property {(int: number|undefined) => void} [decrement] Decrement text input number value callback.
 * @property {boolean} [isTypeNumeric] Whether the type is numeric.
 * @property {string} [dragAxis] The drag axis, e.g., `x` or `y`.
 */

/**
 * @param {Props} props
 */
export function useBaseDragHandlers( {
	decrement = noop,
	dragAxis,
	increment = noop,
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
	};

	return gestures;
}
