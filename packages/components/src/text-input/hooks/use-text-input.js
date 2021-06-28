/**
 * External dependencies
 */
import { cx } from 'emotion';
import TextareaAutosize from 'react-autosize-textarea';

/**
 * WordPress dependencies
 */
import { useCallback, useEffect, useMemo } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { useContextSystem } from '../../ui/context';
import { useBaseField } from '../../base-field';
import { useFormGroupContextId } from '../../ui/form-group';
import * as styles from '../styles';
import { useTextInputState } from './use-text-input-state';

/**
 * @typedef Props
 * @property {import('react').MutableRefObject<any>} [dragHandlersRef] Drag handlers ref.
 * @property {import('react').MutableRefObject<undefined | HTMLElement>} [inputRef] The input element ref.
 * @property {boolean} [isFocused] Renders focus styles.
 * @property {boolean} [isTypeNumeric] Whether the type is numeric.
 */

/**
 * @param {Props} props
 */
const useRootEventHandlers = ( {
	dragHandlersRef,
	inputRef,
	isFocused,
	isTypeNumeric,
} ) => {
	const canScroll = isTypeNumeric && isFocused;
	const dragHandlers = dragHandlersRef?.current;

	useEffect( () => {
		const handleOnWheel = () => {};
		if ( inputRef?.current?.addEventListener ) {
			inputRef?.current.addEventListener( 'wheel', handleOnWheel, {
				passive: false,
			} );
		}
	}, [ inputRef, canScroll ] );

	const handleOnClick = useCallback( () => {
		inputRef?.current?.focus();
	}, [ inputRef ] );

	const handleOnTouchStart = useCallback( () => {
		inputRef?.current?.focus();
	}, [ inputRef ] );

	return {
		...dragHandlers,
		onClick: handleOnClick,
		onTouchStart: handleOnTouchStart,
	};
};

/**
 *
 * @param  {import('../../ui/context').PolymorphicComponentProps<import('../types').Props, 'input'>} props
 */
export function useTextInput( props ) {
	const {
		arrows = true,
		className,
		defaultValue = '',
		disabled,
		dragAxis,
		error = false,
		format,
		id: idProp,
		incrementFromNonNumericValue = false,
		isCommitOnBlurOrEnter = false,
		isFocused: isFocusedProp,
		isInline = false,
		isResizable = false,
		isShiftStepEnabled = true,
		max,
		min,
		multiline = false,
		prefix,
		shiftStep = 10,
		size = 'medium',
		step = 1,
		suffix,
		type = 'text',
		validate,
		value: valueProp,
		...otherProps
	} = useContextSystem( props, 'TextInput' );

	const id = useFormGroupContextId( idProp );

	const {
		decrement,
		dragHandlersRef,
		increment,
		inputRef,
		isFocused,
		isInputTypeNumeric,
		isTypeNumeric,
		scrollHandlers,
		value,
		...textInputState
	} = useTextInputState( {
		...otherProps,
		format,
		defaultValue,
		incrementFromNonNumericValue,
		isCommitOnBlurOrEnter,
		isFocused: isFocusedProp,
		isShiftStepEnabled,
		max,
		min,
		shiftStep,
		step,
		value: valueProp,
		validate,
		type,
	} );

	const rootEventHandlers = useRootEventHandlers( {
		inputRef,
		dragHandlersRef,
		isTypeNumeric,
		isFocused,
	} );

	// @ts-ignore To check: incompatible with PolymorphicComponentProps and missing children
	const baseFieldProps = useBaseField( {
		disabled,
		hasError: error,
		isInline,
	} );

	const InputComponent = multiline ? TextareaAutosize : 'input';

	const classes = useMemo(
		() =>
			cx(
				baseFieldProps.className,
				multiline && styles.multiline,
				className
			),
		[ baseFieldProps.className, className, multiline ]
	);

	const inputClasses = useMemo(
		() =>
			cx(
				styles.Input,
				styles[ size ],
				multiline && styles.inputMultiline,
				isResizable && styles.resizable,
				multiline && styles.scrollableScrollbar
			),
		[ isResizable, multiline, size ]
	);

	const inputProps = {
		as: InputComponent,
		...otherProps,
		...textInputState,
		className: inputClasses,
		id,
		min,
		max,
		step,
		type,
		value,
	};

	return {
		...baseFieldProps,
		...rootEventHandlers,
		arrows,
		className: classes,
		decrement,
		disabled,
		dragAxis,
		dragHandlersRef,
		format,
		increment,
		inputProps,
		inputRef,
		isTypeNumeric,
		isInputTypeNumeric,
		prefix,
		// @ts-ignore This method might need typing: useScrollHandlers packages/components/src/text-input/hooks/use-text-input-state.js
		scrollHandlers,
		suffix,
	};
}
