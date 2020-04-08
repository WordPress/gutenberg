/**
 * External dependencies
 */
import { clamp, noop } from 'lodash';
import classNames from 'classnames';
import { useDrag } from 'react-use-gesture';
import { css } from '@emotion/core';
import styled from '@emotion/styled';

/**
 * WordPress dependencies
 */
import { forwardRef, useState } from '@wordpress/element';
import { UP, DOWN } from '@wordpress/keycodes';

/**
 * Internal dependencies
 */
import InputControl from '../input-control';
import {
	DRAG_CURSOR,
	useDragCursor,
	add,
	subtract,
	roundClampString,
} from './utils';

export function NumberControl(
	{
		className,
		label,
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
		( { dragging, delta, event, shiftKey } ) => {
			if ( ! isDragEnabled ) return;
			if ( ! dragging ) {
				setIsDragging( false );
				return;
			}

			event.stopPropagation();

			const [ , y ] = delta;
			const modifier = shiftKey ? shiftStep : 1;
			const distance = y * modifier * -1;

			if ( distance !== 0 ) {
				const nextValue = roundClampString(
					add( valueProp, distance ),
					min,
					max,
					modifier
				);
				onChange( nextValue, { event } );
			}

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

				nextValue = add( nextValue, incrementalValue );
				nextValue = roundClampString(
					nextValue,
					min,
					max,
					incrementalValue
				);

				onChange( nextValue, { event } );

				break;

			case DOWN:
				event.preventDefault();

				nextValue = subtract( nextValue, incrementalValue );
				nextValue = roundClampString(
					nextValue,
					min,
					max,
					incrementalValue
				);

				onChange( nextValue, { event } );

				break;
		}
	};

	const handleOnChange = ( value, { event } ) => {
		onChange( value, { event } );
	};

	const classes = classNames( 'component-number-control', className );
	const style = {
		...styleProp,
		cursor: isDragging ? DRAG_CURSOR : styleProp?.cursor,
		userSelect: isDragging ? 'none' : styleProp?.userSelect,
	};

	return (
		<Input
			inputMode="numeric"
			{ ...props }
			{ ...dragGestureProps() }
			className={ classes }
			label={ label }
			isDragging={ isDragging }
			ref={ ref }
			onChange={ handleOnChange }
			onKeyDown={ handleOnKeyDown }
			style={ style }
			type="number"
			value={ valueProp }
		/>
	);
}

const dragStyles = ( { isDragging } ) => {
	if ( ! isDragging ) return '';

	return css`
		user-select: none;

		&::-webkit-outer-spin-button,
		&::-webkit-inner-spin-button {
			-webkit-appearance: none !important;
			margin: 0 !important;
		}
	`;
};

const Input = styled( InputControl )`
	${dragStyles};
`;

export default forwardRef( NumberControl );
