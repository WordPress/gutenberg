/**
 * External dependencies
 */
import { noop } from 'lodash';
import { useDrag } from 'react-use-gesture';

/**
 * WordPress dependencies
 */
import { forwardRef } from '@wordpress/element';
import { UP, DOWN, ENTER } from '@wordpress/keycodes';
/**
 * Internal dependencies
 */
import { useDragCursor } from './utils';
import { Input } from './styles/input-control-styles';
import { useInputControlStateReducer } from './state';
import { isValueEmpty } from '../utils/values';
import { useUpdateEffect } from '../utils';

function InputField(
	{
		disabled = false,
		dragDirection = 'n',
		dragThreshold = 10,
		id,
		isDragEnabled = false,
		isFocused,
		isPressEnterToChange = false,
		onBlur = noop,
		onChange = noop,
		onDrag = noop,
		onDragEnd = noop,
		onDragStart = noop,
		onFocus = noop,
		onKeyDown = noop,
		onValidate = noop,
		size = 'default',
		setIsFocused,
		stateReducer = ( state ) => state,
		value: valueProp,
		type,
		...props
	},
	ref
) {
	const {
		// State
		state,
		// Actions
		change,
		commit,
		drag,
		dragEnd,
		dragStart,
		invalidate,
		pressDown,
		pressEnter,
		pressUp,
		reset,
		update,
	} = useInputControlStateReducer( stateReducer, {
		isDragEnabled,
		value: valueProp,
		isPressEnterToChange,
	} );

	const { _event, value, isDragging, isDirty } = state;

	const dragCursor = useDragCursor( isDragging, dragDirection );

	/*
	 * Syncs value state using the focus state to determine the direction.
	 * Without focus it updates the value from the props. With focus it
	 * propagates the value and event through onChange.
	 */
	useUpdateEffect( () => {
		if ( valueProp === value ) {
			return;
		}
		if ( ! isFocused ) {
			update( valueProp );
		} else if ( ! isDirty ) {
			onChange( value, { event: _event } );
		}
	}, [ value, isDirty, isFocused, valueProp ] );

	const handleOnBlur = ( event ) => {
		onBlur( event );
		setIsFocused( false );

		/**
		 * If isPressEnterToChange is set, this commits the value to
		 * the onChange callback.
		 */
		if ( isPressEnterToChange && isDirty ) {
			if ( ! isValueEmpty( value ) ) {
				handleOnCommit( { target: { value } }, event );
			} else {
				reset( valueProp );
			}
		}
	};

	/*
	 * Works around the odd UA (e.g. Firefox) that does not focus inputs of
	 * type=number when their spinner arrows are pressed.
	 */
	let handleOnMouseDown;
	if ( type === 'number' ) {
		handleOnMouseDown = ( event ) => {
			if ( event.target !== event.target.ownerDocument.activeElement ) {
				event.target.focus();
			}
		};
	}

	const handleOnFocus = ( event ) => {
		onFocus( event );
		setIsFocused( true );
	};

	const handleOnChange = ( event ) => {
		const nextValue = event.target.value;
		change( nextValue, event );
	};

	const handleOnCommit = ( event ) => {
		const nextValue = event.target.value;

		try {
			onValidate( nextValue, { event } );
			commit( nextValue, event );
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
					handleOnCommit( event );
				}
				break;
		}
	};

	const dragGestureProps = useDrag(
		( dragProps ) => {
			const { distance, dragging, event } = dragProps;

			if ( ! isDragEnabled ) return;
			if ( ! distance ) return;
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
			onBlur={ handleOnBlur }
			onChange={ handleOnChange }
			onFocus={ handleOnFocus }
			onKeyDown={ handleOnKeyDown }
			onMouseDown={ handleOnMouseDown }
			ref={ ref }
			size={ size }
			value={ value }
			type={ type }
		/>
	);
}

const ForwardedComponent = forwardRef( InputField );

export default ForwardedComponent;
