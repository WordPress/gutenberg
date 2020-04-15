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
import { useDragCursor, add, subtract, roundClampString } from './utils';
import { useRtl } from '../utils/style-mixins';

export function NumberControl(
	{
		className,
		label,
		dragDirection = 'n',
		dragThreshold = 10,
		hideHTMLArrows = false,
		isDragEnabled = true,
		isShiftStepEnabled = true,
		max = Infinity,
		min = -Infinity,
		onChange = noop,
		onKeyDown = noop,
		shiftStep = 10,
		step = 1,
		value: valueProp,
		...props
	},
	ref
) {
	const [ isDragging, setIsDragging ] = useState( false );
	const baseValue = clamp( 0, min, max );
	const isRtl = useRtl();

	const dragCursor = useDragCursor( isDragging, dragDirection );

	const dragGestureProps = useDrag(
		( { dragging, delta, event, shiftKey } ) => {
			if ( ! isDragEnabled ) return;
			if ( ! dragging ) {
				setIsDragging( false );
				return;
			}

			event.stopPropagation();

			const [ x, y ] = delta;
			const modifier = shiftKey ? shiftStep : 1;
			let directionModifier;
			let directionBaseValue;

			switch ( dragDirection ) {
				case 'n':
					directionBaseValue = y;
					directionModifier = -1;
					break;
				case 'e':
					directionBaseValue = x;
					directionModifier = isRtl ? -1 : 1;
					break;
				case 's':
					directionBaseValue = y;
					directionModifier = 1;
					break;
				case 'w':
					directionBaseValue = x;
					directionModifier = isRtl ? 1 : -1;
					break;
			}

			const distance = directionBaseValue * modifier * directionModifier;
			let nextValue;

			if ( distance !== 0 ) {
				nextValue = roundClampString(
					add( valueProp, distance ),
					min,
					max,
					modifier
				);
				handleOnChange( nextValue, { event } );
			}

			if ( ! isDragging ) {
				setIsDragging( true );
			}
		},
		{
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

				handleOnChange( nextValue, { event } );

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

				handleOnChange( nextValue, { event } );

				break;
		}
	};

	const handleOnChange = ( value, { event } ) => {
		const parsedValue = parseFloat( value );
		const nextValue = isNaN( parsedValue ) ? nextValue : parsedValue;

		onChange( nextValue, { event } );
	};

	const classes = classNames( 'component-number-control', className );

	return (
		<Input
			inputMode="numeric"
			{ ...props }
			{ ...dragGestureProps() }
			className={ classes }
			dragCursor={ dragCursor }
			hideHTMLArrows={ hideHTMLArrows }
			isDragging={ isDragging }
			label={ label }
			onChange={ handleOnChange }
			onKeyDown={ handleOnKeyDown }
			ref={ ref }
			type="number"
			value={ valueProp }
		/>
	);
}

const dragStyles = ( { isDragging, dragCursor } ) => {
	let defaultArrowStyles = '';
	let activeDragCursorStyles = '';

	if ( isDragging ) {
		defaultArrowStyles = css`
			cursor: ${dragCursor};
			user-select: none;

			&::-webkit-outer-spin-button,
			&::-webkit-inner-spin-button {
				-webkit-appearance: none !important;
				margin: 0 !important;
			}
		`;
	}

	if ( dragCursor ) {
		activeDragCursorStyles = css`
			&:active {
				cursor: ${dragCursor};
			}
		`;
	}

	return css`
		${defaultArrowStyles};
		${activeDragCursorStyles};
	`;
};

const htmlArrowStyles = ( { hideHTMLArrows } ) => {
	if ( ! hideHTMLArrows ) return ``;

	return css`
		&::-webkit-outer-spin-button,
		&::-webkit-inner-spin-button {
			-webkit-appearance: none !important;
			margin: 0 !important;
		}
	`;
};

const Input = styled( InputControl )`
	${dragStyles};
	${htmlArrowStyles};
`;

export default forwardRef( NumberControl );
