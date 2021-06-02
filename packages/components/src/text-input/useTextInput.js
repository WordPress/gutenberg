import { useContextSystem } from '@wp-g2/context';
import { cx } from '@wp-g2/styles';
import { useCallback, useEffect, useMemo } from 'react';
import TextareaAutosize from 'react-textarea-autosize';

import { useBaseField } from '../BaseField';
import { useFormGroupContextId } from '../FormGroup';
import * as styles from './styles';
import { useTextInputState } from './useTextInputState';

const useRootEventHandlers = ( {
	dragHandlersRef,
	inputRef,
	isFocused,
	isTypeNumeric,
} ) => {
	const canScroll = isTypeNumeric && isFocused;
	const dragHandlers = dragHandlersRef.current;

	useEffect( () => {
		const handleOnWheel = () => {
			if ( ! canScroll ) return;
		};
		if ( inputRef.current.addEventListener ) {
			inputRef.current.addEventListener( 'wheel', handleOnWheel, {
				passive: false,
			} );
		}
	}, [ inputRef, canScroll ] );

	const handleOnClick = useCallback( () => {
		inputRef.current.focus();
	}, [ inputRef ] );

	const handleOnTouchStart = useCallback( () => {
		inputRef.current.focus();
	}, [ inputRef ] );

	return {
		...dragHandlers,
		onClick: handleOnClick,
		onTouchStart: handleOnTouchStart,
	};
};

/**
 *
 * @param {import('@wp-g2/create-styles').ViewOwnProps<import('./types').Props, 'input'>} props
 */
export function useTextInput( props ) {
	const {
		align,
		arrows = true,
		className,
		defaultValue = '',
		disabled,
		dragAxis,
		error = false,
		format,
		gap = 2.5,
		id: idProp,
		incrementFromNonNumericValue = false,
		isCommitOnBlurOrEnter = false,
		isFocused: isFocusedProp,
		isInline = false,
		isResizable = false,
		isShiftStepEnabled = true,
		justify,
		max,
		min,
		multiline = false,
		prefix,
		shiftStep = 10,
		size = 'medium',
		step,
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

	const baseFieldProps = useBaseField( {
		align,
		disabled,
		error,
		gap,
		isFocused,
		isInline,
		justify,
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
		prefix,
		suffix,
	};
}
