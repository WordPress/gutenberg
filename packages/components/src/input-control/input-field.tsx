/**
 * External dependencies
 */
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
/**
 * Internal dependencies
 */
import type { WordPressComponentProps } from '../ui/context';
import { useDragCursor } from './utils';
import { Input } from './styles/input-control-styles';
import { useInputControlStateReducer } from './reducer/reducer';
import type { InputFieldProps } from './types';

const noop = () => {};

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
		stateReducer = ( state: any ) => state,
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
	} = useInputControlStateReducer(
		stateReducer,
		{
			isDragEnabled,
			value: valueProp,
			isPressEnterToChange,
		},
		onChange
	);

	const { value, isDragging, isDirty } = state;
	const wasDirtyOnBlur = useRef( false );

	const dragCursor = useDragCursor( isDragging, dragDirection );

	const handleOnBlur = ( event: FocusEvent< HTMLInputElement > ) => {
		onBlur( event );
		setIsFocused?.( false );

		/**
		 * If isPressEnterToChange is set, this commits the value to
		 * the onChange callback.
		 */
		if ( isDirty || ! event.target.validity.valid ) {
			wasDirtyOnBlur.current = true;
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
		const { key } = event;
		onKeyDown( event );

		switch ( key ) {
			case 'ArrowUp':
				pressUp( event );
				break;

			case 'ArrowDown':
				pressDown( event );
				break;

			case 'Enter':
				pressEnter( event );

				if ( isPressEnterToChange ) {
					event.preventDefault();
					handleOnCommit( event );
				}
				break;

			case 'Escape':
				if ( isPressEnterToChange && isDirty ) {
					event.preventDefault();
					reset( valueProp, event );
				}
				break;
		}
	};

	const dragGestureProps = useDrag< PointerEvent< HTMLInputElement > >(
		( dragProps ) => {
			const { distance, dragging, event, target } = dragProps;

			// The `target` prop always references the `input` element while, by
			// default, the `dragProps.event.target` property would reference the real
			// event target (i.e. any DOM element that the pointer is hovering while
			// dragging). Ensuring that the `target` is always the `input` element
			// allows consumers of `InputControl` (or any higher-level control) to
			// check the input's validity by accessing `event.target.validity.valid`.
			dragProps.event = {
				...dragProps.event,
				target,
			};

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
			// Fallback to `''` to avoid "uncontrolled to controlled" warning.
			// See https://github.com/WordPress/gutenberg/pull/47250 for details.
			value={ value ?? '' }
			type={ type }
		/>
	);
}

const ForwardedComponent = forwardRef( InputField );

export default ForwardedComponent;
