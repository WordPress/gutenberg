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
import { UP, DOWN, ENTER } from '@wordpress/keycodes';

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
import { isValueEmpty, useValueState } from '../input-control/utils';
import { useRtl } from '../utils/style-mixins';

export function NumberControl(
	{
		className,
		dragDirection = 'n',
		dragThreshold = 10,
		hideHTMLArrows = false,
		isDragEnabled = true,
		isPressEnterToChange = false,
		isShiftStepEnabled = true,
		label,
		max = Infinity,
		min = -Infinity,
		onDragStart = noop,
		onDrag = noop,
		onDragEnd = noop,
		onBlur = noop,
		onChange = noop,
		onKeyDown = noop,
		shiftStep = 10,
		step = 1,
		value: valueProp,
		...props
	},
	ref
) {
	const [ value, setValue ] = useValueState( valueProp );
	const [ isDragging, setIsDragging ] = useState( false );
	const [ isDirty, setIsDirty ] = useState( false );
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
			const _forceUpdate = true;

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

				handleOnChange( nextValue, { event }, _forceUpdate );
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

	const handleOnBlur = ( event ) => {
		const _forceUpdate = true;
		onBlur( event );

		/**
		 * If isPressEnterToChange is set, this submits the value to
		 * the onChange callback.
		 */
		if ( isPressEnterToChange && ! isValueEmpty( value ) && isDirty ) {
			handleOnChange( value, { event }, _forceUpdate );
		}
	};

	const handleOnChange = ( next, changeProps, _forceUpdate = false ) => {
		/**
		 * The _forceUpdate parameter is used to better control when
		 * isPressEnterToChange is set.
		 */
		const nextValue = getValue( next );

		if ( ! isPressEnterToChange || _forceUpdate ) {
			setIsDirty( false );
			onChange( nextValue, changeProps );
			setValue( nextValue );
		} else {
			setIsDirty( true );
			setValue( next );
		}
	};

	const handleOnKeyDown = ( event ) => {
		onKeyDown( event );
		const { value: currentValue } = event.target;

		const _forceUpdate = true;
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

				handleOnChange( nextValue, { event }, _forceUpdate );

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

				handleOnChange( nextValue, { event }, _forceUpdate );

				break;

			case ENTER:
				if ( isPressEnterToChange ) {
					event.preventDefault();

					nextValue = roundClampString(
						nextValue,
						min,
						max,
						incrementalValue
					);

					handleOnChange( nextValue, { event }, _forceUpdate );
				}

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
			isPressEnterToChange={ isPressEnterToChange }
			label={ label }
			onBlur={ handleOnBlur }
			onChange={ handleOnChange }
			onKeyDown={ handleOnKeyDown }
			ref={ ref }
			value={ value }
		/>
	);
}

export default forwardRef( NumberControl );
