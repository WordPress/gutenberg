/**
 * External dependencies
 */
import { clamp, noop } from 'lodash';
import classNames from 'classnames';
import { useDrag } from 'react-use-gesture';

/**
 * WordPress dependencies
 */
import { forwardRef, useState } from '@wordpress/element';
import { UP, DOWN } from '@wordpress/keycodes';

/**
 * Internal dependencies
 */
import { DRAG_CURSOR, useDragCursor, add } from './utils';

export function NumberControl(
	{
		className,
		dragAxis = 'y',
		dragThreshold = 10,
		isDragEnabled = true,
		isShiftStepEnabled = true,
		max = Infinity,
		min = -Infinity,
		onChange = noop,
		onKeyDown = noop,
		shiftStep = 10,
		step = 1,
		style: styleProp,
		value: valueProp,
		...props
	},
	ref
) {
	const [ isDragging, setIsDragging ] = useState( false );
	const baseValue = clamp( 0, min, max );

	useDragCursor( isDragging );

	const dragGestureProps = useDrag(
		( { dragging, delta, event } ) => {
			if ( ! isDragEnabled ) return;
			if ( ! dragging ) {
				setIsDragging( false );
				return;
			}

			event.stopPropagation();

			const [ , y ] = delta;
			const distance = y * -1;
			const nextValue = clamp( add( valueProp, distance ), min, max );

			onChange( nextValue.toString(), { event } );

			if ( ! isDragging ) {
				setIsDragging( true );
			}
		},
		{
			axis: dragAxis,
			threshold: dragThreshold,
			enabled: isDragEnabled,
		}
	);

	const handleOnKeyDown = ( event ) => {
		onKeyDown( event );
		const { value } = event.target;

		const isEmpty = value === '';
		const enableShift = event.shiftKey && isShiftStepEnabled;

		const incrementalValue = enableShift
			? parseFloat( shiftStep )
			: parseFloat( step );
		let nextValue = isEmpty ? baseValue : value;

		// Convert to a number to use math
		nextValue = parseFloat( nextValue );

		switch ( event.keyCode ) {
			case UP:
				event.preventDefault();

				nextValue = nextValue + incrementalValue;
				nextValue = clamp( nextValue, min, max );

				onChange( nextValue.toString(), { event } );

				break;

			case DOWN:
				event.preventDefault();

				nextValue = nextValue - incrementalValue;
				nextValue = clamp( nextValue, min, max );

				onChange( nextValue.toString(), { event } );

				break;
		}
	};

	const handleOnChange = ( event ) => {
		onChange( event.target.value, { event } );
	};

	const classes = classNames( 'component-number-control', className );
	const style = {
		...styleProp,
		cursor: isDragging ? DRAG_CURSOR : styleProp?.cursor,
		userSelect: isDragging ? 'none' : styleProp?.userSelect,
	};

	return (
		<input
			inputMode="numeric"
			{ ...props }
			{ ...dragGestureProps() }
			className={ classes }
			ref={ ref }
			onChange={ handleOnChange }
			onKeyDown={ handleOnKeyDown }
			style={ style }
			type="number"
			value={ valueProp }
		/>
	);
}

export default forwardRef( NumberControl );
