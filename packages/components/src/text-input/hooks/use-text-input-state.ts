/**
 * External dependencies
 */
import { isNil, noop } from 'lodash';
// eslint-disable-next-line no-restricted-imports
import type { KeyboardEvent, MutableRefObject } from 'react';

/**
 * WordPress dependencies
 */
import { useCallback, useRef } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { useBaseDragHandlers } from './use-base-drag-handlers';
import { useCommitValue } from './use-commit-value';
import { useFocusedState } from './use-focused-state';
import { useNumberActions } from './use-number-actions';
import { useChangeHandlers } from './use-change-handlers';
import { mergeEventHandlers } from '../../utils/events';
import { useControlledValue, useLatestRef } from '../../utils';
import type { DragAxis } from '../types';
import { useFocusHandlers } from './use-focus-handlers';
import { useKeyboardHandlers } from './use-keyboard-handlers';
import { useNumberKeyboardHandlers } from './use-number-keyboard-handlers';
import { useScrollHandlers } from './use-scroll-handlers';

export interface UseTextInputStateProps {
	defaultValue?: string;
	dragAxis?: DragAxis;
	incrementFromNonNumericValue?: boolean;
	isCommitOnBlurOrEnter?: boolean;
	isFocused?: boolean;
	onChange?: ( value: string ) => void;
	value?: string;
	max?: number;
	min?: number;
	step?: number;
	validate?: ( value: string ) => boolean;
	isShiftStepEnabled?: boolean;
	shiftStep?: number;
	type?: string;
	format?: string;
	scrollHandlers?: Record< string, ( event: WheelEvent ) => void >;
}

/**
 *
 * @param {UseTextInputStateProps} props
 */
export function useTextInputState( props: UseTextInputStateProps ) {
	const {
		defaultValue,
		dragAxis = 'y',
		incrementFromNonNumericValue = false,
		isCommitOnBlurOrEnter = false,
		isFocused: isFocusedProp = false,
		onChange: onChangeProp,
		value: valueProp,
		min = Infinity,
		max = Infinity,
		step = 1,
		validate,
		isShiftStepEnabled = true,
		shiftStep = 10,
		type,
		format,
		...otherProps
	} = props;

	const inputRef: MutableRefObject<
		HTMLElement | undefined
	> = useRef< HTMLElement >();

	const [ value, onChange ] = useControlledValue( {
		value: valueProp,
		onChange: onChangeProp,
		defaultValue,
	} );

	const isInputTypeNumeric = type === 'number';
	const isTypeNumeric = format === 'number' || isInputTypeNumeric;

	const [ commitValue, setCommitValue, resetCommitValue ] = useCommitValue(
		value
	);
	const inputValue = isNil( commitValue ) ? value : commitValue;

	const [ isFocused, setFocused ] = useFocusedState( isFocusedProp );

	const handleOnCommit = useCallback(
		( next ) => {
			let isValid = true;
			const hasValidation = typeof validate === 'function';

			if ( hasValidation ) {
				// @ts-ignore We checked `validate` above for `hasValidation`
				isValid = validate( next, value ) !== false;
			}

			if ( isValid ) {
				onChange( next );
			}
			resetCommitValue();
		},
		[ onChange, resetCommitValue, validate, value ]
	);

	const { decrement, increment } = useNumberActions( {
		incrementFromNonNumericValue,
		isShiftStepEnabled,
		max,
		min,
		onChange,
		shiftStep,
		step,
		type,
		value,
		ref: inputRef,
	} );

	const changeHandlers = useChangeHandlers(
		isCommitOnBlurOrEnter ? setCommitValue : onChange
	);

	const focusHandlers = useFocusHandlers( {
		onChange: isCommitOnBlurOrEnter ? handleOnCommit : noop,
		setFocused,
	} );

	const dragHandlers = useBaseDragHandlers( {
		increment,
		decrement,
		isTypeNumeric,
		dragAxis,
	} );

	const dragHandlersRef = useLatestRef( dragHandlers );

	const baseKeyboardHandlers = useKeyboardHandlers( {
		onChange: isCommitOnBlurOrEnter ? handleOnCommit : noop,
	} );

	const numberKeyboardHandlers = useNumberKeyboardHandlers( {
		increment,
		decrement,
		isTypeNumeric,
	} );

	const keyboardHandlers = useLatestRef(
		mergeEventHandlers<
			KeyboardEvent< HTMLInputElement >,
			typeof baseKeyboardHandlers,
			typeof numberKeyboardHandlers
		>( baseKeyboardHandlers, numberKeyboardHandlers )
	).current;

	const scrollHandlers = useScrollHandlers( {
		decrement,
		increment,
		isFocused,
		isTypeNumeric,
	} );

	const handlers = {
		...changeHandlers,
		...dragHandlers,
		...focusHandlers,
		...keyboardHandlers,
		...scrollHandlers,
	};

	return {
		...handlers,
		...otherProps,
		decrement,
		dragHandlersRef,
		increment,
		inputRef,
		isFocused,
		isInputTypeNumeric,
		isTypeNumeric,
		max,
		min,
		step,
		type,
		value: inputValue,
	} as const;
}
