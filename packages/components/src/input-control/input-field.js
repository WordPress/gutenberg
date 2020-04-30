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
		isFloating,
		isFloatingLabelSet,
		isPressEnterToChange = false,
		onBlur = noop,
		onChange = noop,
		onDrag = noop,
		onDragEnd = noop,
		onDragStart = noop,
		onFocus = noop,
		onKeyDown = noop,
		onUpdateValue,
		onValidate = noop,
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
		invalidate,
		pressUp,
		pressDown,
		pressEnter,
		reset,
		submit,
		update,
	} = useInputControlStateReducer( stateReducer, {
		isDragEnabled,
		value: valueProp,
		isPressEnterToChange,
	} );

	const { _event, value, isDragging, isDirty } = state;

	const initialValueRef = useRef( valueProp );
	const valueRef = useRef( value );
	const dragCursor = useDragCursor( isDragging, dragDirection );

	useEffect( () => {
		/**
		 * Handles syncing incoming value changes with internal state.
		 * This effectively enables a "controlled" state.
		 * https://reactjs.org/docs/forms.html#controlled-components
		 */
		if (
			valueProp !== initialValueRef.current &&
			valueProp !== valueRef.current
		) {
			update( valueProp );
			initialValueRef.current = valueProp;
			valueRef.current = valueProp;

			// Quick return to avoid firing the onChange callback
			return;
		}

		/**
		 * Fires the onChange callback when internal state value changes.
		 */
		if ( value !== valueRef.current && ! isDirty ) {
			onChange( value, { event: _event } );
			onUpdateValue( ! isValueEmpty( value ) );

			valueRef.current = value;
		}
	}, [ value, isDirty, valueProp ] );

	const handleOnBlur = ( event ) => {
		onBlur( event );

		/**
		 * If isPressEnterToChange is set, this submits the value to
		 * the onChange callback.
		 */
		if ( isPressEnterToChange && isDirty ) {
			if ( ! isValueEmpty( value ) ) {
				handleOnSubmit( { target: value }, event );
			} else {
				reset( valueProp );
			}
		}
	};

	const handleOnFocus = ( event ) => {
		onFocus( event );
	};

	const handleOnChange = ( event ) => {
		const nextValue = event.target.value;
		change( nextValue, event );
	};

	const handleOnSubmit = ( event ) => {
		const nextValue = event.target.value;

		try {
			onValidate( nextValue, { event } );
			submit( nextValue, event );
		} catch ( err ) {
			invalidate( err, { event } );
		}
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
					handleOnSubmit( event );
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
