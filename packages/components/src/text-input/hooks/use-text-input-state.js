/**
 * External dependencies
 */
import { isNil, noop } from 'lodash';

/**
 * WordPress dependencies
 */
import {
	useCallback,
	useEffect,
	useMemo,
	useRef,
	useState,
} from '@wordpress/element';

/**
 * Internal dependencies
 */
import { useBaseDragHandlers } from './use-text-input-state-utils';
import { isValueNumeric } from '../../utils/values';
import { add, roundClampString, subtract } from '../../utils/math';
import { mergeEventHandlers } from '../../utils/events';
import { normalizeArrowKey } from '../../utils/keyboard';
import { useControlledValue, usePropRef } from '../../utils';

/**
 * @template T
 * @param {Object} props
 * @param {T} [props.value]
 * @return {[T | null, (value: any) => void, () => void]} The controlled value and the value setter.
 */
function useCommitValue( { value } ) {
	const [ commitValue, setCommitValue ] = useState( null );
	const resetCommitValue = useCallback( () => setCommitValue( null ), [] );

	useEffect( resetCommitValue, [ value ] );

	return [ commitValue, setCommitValue, resetCommitValue ];
}

/**
 * @param {Object} props
 * @param {boolean} [props.isShiftStepEnabled]
 * @param {number} [props.shiftStep]
 * @return {number} The shift step value.
 */
function useShiftStep( { isShiftStepEnabled = true, shiftStep = 10 } ) {
	const [ on, setOn ] = useState( false );
	useEffect( () => {
		const handleOnKeyDown = ( /** @type {KeyboardEvent}} */ event ) => {
			if ( ! isShiftStepEnabled ) {
				return;
			}
			if ( event.shiftKey ) {
				setOn( true );
			}
		};
		const handleOnKeyUp = ( /** @type {KeyboardEvent}} */ event ) => {
			if ( ! isShiftStepEnabled ) {
				return;
			}
			if ( event.shiftKey ) {
				setOn( false );
			}
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

/**
 * @param {Object} useFocusedStateProps
 * @param {boolean} useFocusedStateProps.isFocused
 * @return {[boolean, (value: boolean) => void]} A collection of change handlers.
 */
function useFocusedState( { isFocused: isFocusedProp = false } ) {
	const [ isFocused, setFocused ] = useState( isFocusedProp );

	useEffect( () => {
		setFocused( isFocusedProp );
	}, [ isFocusedProp ] );

	return [ isFocused, setFocused ];
}

/**
 * @param {Object} useChangeHandlersProps
 * @param {(value: string) => void} useChangeHandlersProps.onChange
 */
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

/**
 * @param {Object} [useFocusHandlersProps]
 * @param {(value: string) => void} [useFocusHandlersProps.onChange]
 * @param {(value: boolean) => void} [useFocusHandlersProps.setFocused]
 */
function useFocusHandlers( { onChange = noop, setFocused = noop } ) {
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

/**
 * @param {Object} [useKeyboardHandlersProps]
 * @param {(value: string) => void} [useKeyboardHandlersProps.onChange]
 */
function useKeyboardHandlers( { onChange = noop } ) {
	/** @type {Record<string, (event: import('react').KeyboardEvent<HTMLInputElement>) => void>} */
	const keyboardHandlers = useMemo(
		() => ( {
			Enter(
				/** @type {import('react').KeyboardEvent<HTMLInputElement>} */ event
			) {
				if ( event.isDefaultPrevented() ) {
					return;
				}
				onChange( event.currentTarget.value );
			},
		} ),
		[ onChange ]
	);

	const handleOnKeyDown = useCallback(
		(
			/** @type {import('react').KeyboardEvent<HTMLInputElement>}} */ event
		) => {
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

/**
 * @typedef Props
 * @property {number|string|undefined|null} [value] On change callback.
 * @property {Function} [onChange] On change callback.
 * @property {string} [type] Value type.
 * @property {string | number | undefined} [max] Max value.
 * @property {string | number | undefined} [min] Min value.
 * @property {number} [shiftStep] Shift step value.
 * @property {number} [step] Step value.
 * @property {boolean} [isShiftStepEnabled] Is shift step enabled?
 * @property {boolean} [incrementFromNonNumericValue] Increment from non-numeric value.
 */

/**
 * @param {Props} props
 */
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
	const isNumeric = isValueNumeric( value );

	const skipAction =
		! isInputTypeNumeric && ! isNumeric && ! incrementFromNonNumericValue;

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
		( /** @type {number|undefined} */ jumpStep = 0 ) => {
			if ( skipAction ) return;
			/* eslint-disable no-shadow */
			// @ts-ignore Declaring type here doesn't seem to work, e.g., /** @type {{[key:string]:any}|undefined} */
			const { max, min, onChange, shiftStep, value } = propRefs.current;
			/* eslint-enable no-shadow */
			const baseValue = isValueNumeric( value ) ? value : 0;
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
		( /** @type {number|undefined} */ jumpStep = 0 ) => {
			if ( skipAction ) return;
			/* eslint-disable no-shadow */
			// @ts-ignore Declaring type here doesn't seem to work, e.g., /** @type {{[key:string]:any}|undefined} */
			const { max, min, onChange, shiftStep, value } = propRefs.current;
			/* eslint-enable no-shadow */
			const baseValue = isValueNumeric( value ) ? value : 0;
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

/**
 * @typedef UseNumberKeyboardHandlersProps
 * @property {boolean} [isTypeNumeric] Whether the type is numeric.
 * @property {boolean} [stopIfEventDefaultPrevented] Stop if event default prevented.
 * @property {() => void} [increment] Increment text input number value callback.
 * @property {() => void} [decrement] Decrement text input number value callback.
 */

/**
 *
 * @param {UseNumberKeyboardHandlersProps} props
 */
function useNumberKeyboardHandlers( {
	decrement = noop,
	increment = noop,
	isTypeNumeric,
	stopIfEventDefaultPrevented = true,
} ) {
	/** @type {Record<string, (event: import('react').KeyboardEvent<HTMLInputElement>) => void>} */
	const keyboardHandlers = useMemo(
		() => ( {
			ArrowUp(
				/** @type {import('react').KeyboardEvent<HTMLInputElement>}} */ event
			) {
				if ( ! isTypeNumeric ) return;

				if ( stopIfEventDefaultPrevented && event.isDefaultPrevented() )
					return;

				event.preventDefault();

				increment();
			},
			ArrowDown(
				/** @type {import('react').KeyboardEvent<HTMLInputElement>}} */ event
			) {
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
		(
			/** @type {import('react').KeyboardEvent<HTMLInputElement>}} */ event
		) => {
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

/**
 * @typedef UseScrollHandlersProps
 * @property {boolean} [isTypeNumeric] Whether the type is numeric.
 * @property {boolean} [isFocused] Is the field focussed.
 * @property {() => void} [increment] Increment text input number value callback.
 * @property {() => void} [decrement] Decrement text input number value callback.
 */

/**
 *
 * @param {UseScrollHandlersProps} props
 */
const useScrollHandlers = ( {
	decrement = noop,
	increment = noop,
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

/**
 * @typedef UseTextInputStateProps
 * @property {string} [defaultValue] A default value.
 * @property {string} [dragAxis]  The drag axis.
 * @property {boolean} [incrementFromNonNumericValue] Should increment from non-numeric value.
 * @property {boolean} [isCommitOnBlurOrEnter] If commit value is to be set onBlur or Enter.
 * @property {boolean} [isFocused] Is the field focussed.
 * @property {(value: string) => void} [onChange] Text input onChange callback.
 * @property {string} [value] Field value.
 * @property {number | string | undefined} [max] Max value.
 * @property {number | string | undefined} [min] Min value.
 * @property {number} [step] Step value.
 * @property {( currentValue: string ) => boolean} [validate] Is the field focussed.
 * @property {boolean} [isShiftStepEnabled] Is shift step enabled?
 * @property {number} [shiftStep] Shift step value.
 * @property {string} [type] Input type.
 * @property {string} [format] Input format.
 * @property {Record<string, (event: Event) => void>} [scrollHandlers] Input format.
 */

/**
 *
 * @param {UseTextInputStateProps} props
 */
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
		isFocused: isFocusedProp,
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
