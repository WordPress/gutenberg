/**
 * External dependencies
 */
import { noop } from 'lodash';
import { useDrag } from 'react-use-gesture';

/**
 * WordPress dependencies
 */
import { useEffect, useRef, forwardRef } from '@wordpress/element';
import { UP, DOWN, ENTER } from '@wordpress/keycodes';
/**
 * Internal dependencies
 */
import { useDragCursor, isValueEmpty } from './utils';
import { Input } from './styles/input-control-styles';
import { useInputControlStateReducer } from './state';

function InputField(
	{
		disabled,
		dragDirection = 'n',
		dragThreshold = 10,
		id,
		isDragEnabled = false,
		isPressEnterToChange = false,
		isFloating,
		isFloatingLabelSet,
		onDragStart = noop,
		onDragEnd = noop,
		onDrag = noop,
		onBlur = noop,
		onChange = noop,
		onFocus = noop,
		onKeyDown = noop,
		onUpdateValue,
		size = 'default',
		stateReducer = ( state ) => state,
		value: valueProp,
		...props
	},
	ref
) {
	const {
		state,
		change,
		drag,
		dragStart,
		dragEnd,
		pressUp,
		pressDown,
		pressEnter,
		reset,
		submit,
	} = useInputControlStateReducer( stateReducer, {
		isDragEnabled,
		value: valueProp,
		isPressEnterToChange,
	} );

	const { _event, value, isDragging, isDirty } = state;

	const valueRef = useRef( value );
	const dragCursor = useDragCursor( isDragging, dragDirection );

	useEffect( () => {
		if ( value !== valueRef.current && ! isDirty ) {
			onChange( value, { event: _event } );
			onUpdateValue( ! isValueEmpty( value ) );

			valueRef.current = value;
		}
	}, [ value, isDirty ] );

	const handleOnBlur = ( event ) => {
		onBlur( event );

		/**
		 * If isPressEnterToChange is set, this submits the value to
		 * the onChange callback.
		 */
		if ( isPressEnterToChange && isDirty ) {
			if ( ! isValueEmpty( value ) ) {
				submit( value, event );
			} else {
				reset( valueProp );
			}
		}
	};

	const handleOnFocus = ( event ) => {
		onFocus( event );
	};

	const handleOnChange = ( event ) => {
		change( event.target.value, event );
	};

	const handleOnKeyDown = ( event ) => {
		const { keyCode } = event;
		onKeyDown( event );

		switch ( keyCode ) {
			case UP:
				pressUp( event );
				break;

			case DOWN:
				pressDown( event );
				break;

			case ENTER:
				pressEnter( event );

				if ( isPressEnterToChange ) {
					event.preventDefault();
					submit( event.target.value, event );
				}
				break;
		}
	};

	const dragGestureProps = useDrag(
		( dragProps ) => {
			const { dragging, event } = dragProps;

			if ( ! isDragEnabled ) return;
			event.stopPropagation();

			/**
			 * Quick return if no longer dragging.
			 * This prevents unnecessary value calculations.
			 */
			if ( ! dragging ) {
				onDragEnd( dragProps );
				dragEnd( dragProps );
				return;
			}

			onDrag( dragProps );
			drag( dragProps );

			if ( ! isDragging ) {
				onDragStart( dragProps );
				dragStart( dragProps );
			}
		},
		{
			threshold: dragThreshold,
			enabled: isDragEnabled,
		}
	);

	return (
		<Input
			{ ...props }
			{ ...dragGestureProps() }
			className="components-input-control__input"
			disabled={ disabled }
			dragCursor={ dragCursor }
			isDragging={ isDragging }
			id={ id }
			isFloating={ isFloating }
			isFloatingLabel={ isFloatingLabelSet }
			onBlur={ handleOnBlur }
			onChange={ handleOnChange }
			onFocus={ handleOnFocus }
			onKeyDown={ handleOnKeyDown }
			ref={ ref }
			size={ size }
			value={ value }
		/>
	);
}

const ForwardedComponent = forwardRef( InputField );

export default ForwardedComponent;
