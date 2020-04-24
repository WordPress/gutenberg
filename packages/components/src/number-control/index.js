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
import { Input } from './styles/number-control-styles';
import {
	add,
	getValue,
	roundClampString,
	subtract,
	useDragCursor,
} from './utils';
import { isValueEmpty } from '../input-control/utils';
import { useRtl } from '../utils/style-mixins';

export function NumberControl(
	{
		className,
		dragDirection = 'n',
		dragThreshold = 10,
		hideHTMLArrows = false,
		isDragEnabled = true,
		isShiftStepEnabled = true,
		label,
		max = Infinity,
		min = -Infinity,
		onChange = noop,
		onDrag = noop,
		onDragEnd = noop,
		onDragStart = noop,
		onKeyDown = noop,
		shiftStep = 10,
		step = 1,
		value: valueProp,
		...props
	},
	ref
) {
	const [ isDragging, setIsDragging ] = useState( false );
	const isRtl = useRtl();
	const dragCursor = useDragCursor( isDragging, dragDirection );

	const baseValue = clamp( 0, min, max );

	const dragGestureProps = useDrag(
		( dragProps ) => {
			const { dragging, delta, event, shiftKey } = dragProps;

			if ( ! isDragEnabled ) return;

			/**
			 * Quick return if no longer dragging.
			 * This prevents unnecessary value calculations.
			 */
			if ( ! dragging ) {
				onDragEnd( dragProps );
				setIsDragging( false );

				return;
			}

			event.stopPropagation();
			onDrag( dragProps );

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
				onDragStart( dragProps );
				setIsDragging( true );
			}
		},
		{
			threshold: dragThreshold,
			enabled: isDragEnabled,
		}
	);

	const handleOnChange = ( next, changeProps ) => {
		const nextValue = getValue( next );

		onChange( nextValue, changeProps );
	};

	const handleOnKeyDown = ( event ) => {
		onKeyDown( event );
		const { value: currentValue } = event.target;

		const enableShift = event.shiftKey && isShiftStepEnabled;

		const incrementalValue = enableShift
			? parseFloat( shiftStep )
			: parseFloat( step );
		let nextValue = isValueEmpty( currentValue ) ? baseValue : currentValue;

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

	const classes = classNames( 'components-number-control', className );

	return (
		<Input
			inputMode="numeric"
			type="number"
			{ ...props }
			{ ...dragGestureProps() }
			className={ classes }
			dragCursor={ dragCursor }
			hideHTMLArrows={ hideHTMLArrows }
			isDragging={ isDragging }
			label={ label }
			onChange={ handleOnChange }
			onKeyDown={ handleOnKeyDown }
			transformValueOnChange={ getValue }
			ref={ ref }
			value={ valueProp }
		/>
	);
}

export default forwardRef( NumberControl );
