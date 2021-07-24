/**
 * External dependencies
 */
import { noop } from 'lodash';
import { useDrag } from '@use-gesture/react';
import type {
	SyntheticEvent,
	ChangeEvent,
	KeyboardEvent,
	PointerEvent,
	FocusEvent,
	ForwardedRef,
	MouseEvent,
} from 'react';

/**
 * WordPress dependencies
 */
import { forwardRef, useRef } from '@wordpress/element';
import { UP, DOWN, ENTER, ESCAPE } from '@wordpress/keycodes';
/**
 * Internal dependencies
 */
import type { WordPressComponentProps } from '../ui/context';
import { useDragCursor } from './utils';
import { Input } from './styles/input-control-styles';
import { useInputControlStateReducer } from './reducer/reducer';
import { useUpdateEffect } from '../utils';
import type { InputFieldProps } from './types';

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
		stateReducer,
		value: valueProp,
		type,
		...props
	}: WordPressComponentProps< InputFieldProps, 'input', false >,
	ref: ForwardedRef< HTMLInputElement >
) {
	const {
		// State.
		state,
		// Actions.
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

	const { _event, value, isDragging, isDirty, error } = state;
	const wasPendentOnBlur = useRef( false );

	const dragCursor = useDragCursor( isDragging, dragDirection );

	/*
	 * Handles switching modes between controlled – while not focused – and
	 * self-controlled – while focused. Exceptions are made when the internal
	 * value is either dirty or invalid. In such cases, the value does not
	 * propagate while focused and the first render while not focused ignores
	 * the value from props and instead propagates the internal value.
	 */
	useUpdateEffect( () => {
		if ( valueProp === value ) {
			return;
		}
		if ( ! isFocused && ! wasPendentOnBlur.current ) {
			update( valueProp, _event as SyntheticEvent );
		} else if ( ! isDirty && ! error ) {
			onChange( value, {
				event: _event as ChangeEvent< HTMLInputElement >,
			} );
			wasPendentOnBlur.current = false;
		}
	}, [ value, isDirty, isFocused, valueProp, error ] );

	const handleOnBlur = ( event: FocusEvent< HTMLInputElement > ) => {
		onBlur( event );
		setIsFocused?.( false );
		/*
		 * Commits the value when it's either dirty or invalid as such values
		 * will have not yet propagated.
		 */
		if ( isDirty || error ) {
			wasPendentOnBlur.current = true;
			handleOnCommit( event );
		}
	};

	const handleOnFocus = ( event: FocusEvent< HTMLInputElement > ) => {
		onFocus( event );
		setIsFocused?.( true );
	};

	const handleOnChange = ( event: ChangeEvent< HTMLInputElement > ) => {
		const nextValue = event.target.value;
		change( nextValue, event );
	};

	const handleOnCommit = ( event: SyntheticEvent< HTMLInputElement > ) => {
		const nextValue = event.currentTarget.value;

		try {
			onValidate( nextValue );
			commit( nextValue, event );
		} catch ( err ) {
			invalidate( err, event );
		}
	};

	const handleOnKeyDown = ( event: KeyboardEvent< HTMLInputElement > ) => {
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

			case ESCAPE:
				if ( isPressEnterToChange && isDirty ) {
					event.preventDefault();
					reset( valueProp, event );
				}
				break;
		}
	};

	const dragGestureProps = useDrag< PointerEvent< HTMLInputElement > >(
		( dragProps ) => {
			const { distance, dragging, event } = dragProps;

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
			axis: dragDirection === 'e' || dragDirection === 'w' ? 'x' : 'y',
			threshold: dragThreshold,
			enabled: isDragEnabled,
			pointer: { capture: false },
		}
	);

	const dragProps = isDragEnabled ? dragGestureProps() : {};
	/*
	 * Works around the odd UA (e.g. Firefox) that does not focus inputs of
	 * type=number when their spinner arrows are pressed.
	 */
	let handleOnMouseDown;
	if ( type === 'number' ) {
		handleOnMouseDown = ( event: MouseEvent< HTMLInputElement > ) => {
			props.onMouseDown?.( event );
			if (
				event.currentTarget !==
				event.currentTarget.ownerDocument.activeElement
			) {
				event.currentTarget.focus();
			}
		};
	}

	return (
		<Input
			{ ...props }
			{ ...dragProps }
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
			inputSize={ size }
			value={ value }
			type={ type }
		/>
	);
}

const ForwardedComponent = forwardRef( InputField );

export default ForwardedComponent;
