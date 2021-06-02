import {
	add,
	is,
	mergeEventHandlers,
	normalizeArrowKey,
	roundClampString,
	subtract,
	useControlledValue,
	usePropRef,
} from '@wp-g2/utils';
import { isNil, noop } from 'lodash';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { useBaseDragHandlers } from './useTextInputState.utils';

function useCommitValue( { value } ) {
	const [ commitValue, setCommitValue ] = useState( null );
	const resetCommitValue = useCallback( () => setCommitValue( null ), [] );

	useEffect( resetCommitValue, [ value ] );

	return [ commitValue, setCommitValue, resetCommitValue ];
}

function useShiftStep( { isShiftStepEnabled = true, shiftStep = 10 } ) {
	const [ on, setOn ] = useState( false );
	useEffect( () => {
		const handleOnKeyDown = ( event ) => {
			if ( ! isShiftStepEnabled ) return;
			if ( event.shiftKey ) setOn( true );
		};
		const handleOnKeyUp = ( event ) => {
			if ( ! isShiftStepEnabled ) return;
			if ( ! event.shiftKey ) setOn( false );
		};

		window.addEventListener( 'keydown', handleOnKeyDown );
		window.addEventListener( 'keyup', handleOnKeyUp );

		return () => {
			window.removeEventListener( 'keydown', handleOnKeyDown );
			window.removeEventListener( 'keyup', handleOnKeyUp );
		};
	}, [ isShiftStepEnabled ] );

	return isShiftStepEnabled && on ? shiftStep : 1;
}

function useFocusedState( { isFocused: isFocusedProp = false } ) {
	const [ isFocused, setFocused ] = useState( isFocusedProp );

	useEffect( () => {
		setFocused( isFocusedProp );
	}, [ isFocusedProp ] );

	return [ isFocused, setFocused ];
}

function useChangeHandlers( { onChange } ) {
	const handleOnChange = useCallback(
		( event ) => {
			onChange( event.target.value );
		},
		[ onChange ]
	);

	return {
		onChange: handleOnChange,
	};
}

function useFocusHandlers( { onChange, setFocused } ) {
	const handleOnBlur = useCallback(
		( event ) => {
			onChange( event.target.value );
			setFocused( false );
		},
		[ onChange, setFocused ]
	);

	const handleOnFocus = useCallback( () => {
		setFocused( true );
	}, [ setFocused ] );

	return {
		onBlur: handleOnBlur,
		onFocus: handleOnFocus,
	};
}

function useKeyboardHandlers( { onChange } ) {
	const keyboardHandlers = useMemo(
		() => ( {
			Enter( /** @type {import('react').KeyboardEvent} */ event ) {
				if ( event.isDefaultPrevented() ) return;
				onChange( event.target.value );
			},
		} ),
		[ onChange ]
	);

	const handleOnKeyDown = useCallback(
		( /** @type {import('react').KeyboardEvent}} */ event ) => {
			const key = normalizeArrowKey( event );
			if ( key && keyboardHandlers[ key ] ) {
				keyboardHandlers[ key ]( event );
			}
		},
		[ keyboardHandlers ]
	);

	return {
		onKeyDown: handleOnKeyDown,
	};
}

function useNumberActions( {
	incrementFromNonNumericValue,
	isShiftStepEnabled,
	max,
	min,
	onChange,
	shiftStep: shiftStepProp = 10,
	step = 1,
	type,
	value,
} ) {
	const stepMultiplier =
		useShiftStep( {
			isShiftStepEnabled,
			shiftStep: shiftStepProp,
		} ) || step;
	const shiftStep = stepMultiplier * step;

	const isInputTypeNumeric = type === 'number';
	const isValueNumeric = is.numeric( value );

	const skipAction =
		! isInputTypeNumeric &&
		! isValueNumeric &&
		! incrementFromNonNumericValue;

	/**
	 * Create (synced) references to avoid recreating increment and decrement
	 * callbacks.
	 */

	const propRefs = usePropRef( {
		min,
		max,
		value,
		shiftStep,
		onChange,
	} );

	const increment = useCallback(
		( /** @type {number} */ jumpStep = 0 ) => {
			if ( skipAction ) return;

			const { max, min, onChange, shiftStep, value } = propRefs.current;

			const baseValue = is.numeric( value ) ? value : 0;
			const nextValue = add( jumpStep * step, shiftStep );

			const next = roundClampString(
				add( baseValue, nextValue ),
				min,
				max,
				shiftStep
			);

			onChange( next );
		},
		[ skipAction, propRefs, step ]
	);

	const decrement = useCallback(
		( /** @type {number} */ jumpStep = 0 ) => {
			if ( skipAction ) return;

			const { max, min, onChange, shiftStep, value } = propRefs.current;

			const baseValue = is.numeric( value ) ? value : 0;
			const nextValue = add( jumpStep * step, shiftStep );

			const next = roundClampString(
				subtract( baseValue, nextValue ),
				min,
				max,
				shiftStep
			);

			onChange( next );
		},
		[ skipAction, propRefs, step ]
	);

	return { increment, decrement };
}

function useNumberKeyboardHandlers( {
	decrement,
	increment,
	isTypeNumeric,
	stopIfEventDefaultPrevented = true,
} ) {
	const keyboardHandlers = useMemo(
		() => ( {
			ArrowUp( event ) {
				if ( ! isTypeNumeric ) return;

				if ( stopIfEventDefaultPrevented && event.isDefaultPrevented() )
					return;

				event.preventDefault();

				increment();
			},
			ArrowDown( event ) {
				if ( ! isTypeNumeric ) return;

				if ( stopIfEventDefaultPrevented && event.isDefaultPrevented() )
					return;

				event.preventDefault();

				decrement();
			},
		} ),
		[ decrement, increment, isTypeNumeric, stopIfEventDefaultPrevented ]
	);

	const handleOnKeyDown = useCallback(
		( event ) => {
			const key = normalizeArrowKey( event );
			if ( key && keyboardHandlers[ key ] ) {
				keyboardHandlers[ key ]( event );
			}
		},
		[ keyboardHandlers ]
	);

	return {
		onKeyDown: handleOnKeyDown,
	};
}

const useScrollHandlers = ( {
	decrement,
	increment,
	isFocused,
	isTypeNumeric,
} ) => {
	const handleOnWheel = useCallback(
		( event ) => {
			if ( ! isTypeNumeric ) return;
			if ( ! isFocused ) return;
			if ( event?.deltaY === 0 ) return;

			const isScrollUp = event?.deltaY < 0;

			if ( isScrollUp ) {
				increment();
			} else {
				decrement();
			}

			return false;
		},
		[ decrement, increment, isFocused, isTypeNumeric ]
	);

	return {
		onWheel: handleOnWheel,
	};
};

export function useTextInputState( props ) {
	const {
		defaultValue,
		dragAxis = 'y',
		incrementFromNonNumericValue = false,
		isCommitOnBlurOrEnter = false,
		isFocused: isFocusedProp = false,
		onChange: onChangeProp = noop,
		value: valueProp,
		min,
		max,
		step = 1,
		validate,
		isShiftStepEnabled = true,
		shiftStep = 10,
		type,
		format,
		...otherProps
	} = props;

	const inputRef = useRef();

	const [ value, onChange ] = useControlledValue( {
		value: valueProp,
		onChange: onChangeProp,
		defaultValue,
	} );

	const isInputTypeNumeric = type === 'number';
	const isTypeNumeric = format === 'number' || isInputTypeNumeric;

	const [ commitValue, setCommitValue, resetCommitValue ] = useCommitValue( {
		value,
	} );
	const inputValue = isNil( commitValue ) ? value : commitValue;

	const [ isFocused, setFocused ] = useFocusedState( {
		value: isFocusedProp,
	} );

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
	} );

	const changeHandlers = useChangeHandlers( {
		onChange: isCommitOnBlurOrEnter ? setCommitValue : onChange,
	} );

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

	const dragHandlersRef = usePropRef( dragHandlers );

	const baseKeyboardHandlers = useKeyboardHandlers( {
		onChange: isCommitOnBlurOrEnter ? handleOnCommit : noop,
	} );

	const numberKeyboardHandlers = useNumberKeyboardHandlers( {
		increment,
		decrement,
		isTypeNumeric,
	} );

	const keyboardHandlers = usePropRef(
		mergeEventHandlers( baseKeyboardHandlers, numberKeyboardHandlers )
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
	};
}
