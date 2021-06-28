/**
 * External dependencies
 */
import { clamp, noop } from 'lodash';

/**
 * WordPress dependencies
 */
import {
	forwardRef,
	memo,
	useCallback,
	useEffect,
	useRef,
} from '@wordpress/element';
import { minus, plus } from '@wordpress/icons';

/**
 * Internal dependencies
 */
import Icon from '../icon';
import { HStack } from '../h-stack';
import { View } from '../view';
import * as styles from './styles';

/**
 * @typedef Props
 * @property {boolean} [disabled] Whether the stepper controls are disabled.
 * @property {import('react').MutableRefObject<null | HTMLElement>} [dragHandlersRef] Drag handler React ref.
 * @property {() => void} [increment] Increment text input number value callback.
 * @property {() => void} [decrement] Decrement text input number value callback.
 */

/**
 *
 * @param {Props} props
 * @param {import('react').Ref<any>} forwardedRef
 * @return {import('react').ReactElement} The text input stepper component.
 */
function TextInputSteppers( props, forwardedRef ) {
	const { decrement, disabled, dragHandlersRef, increment } = props;
	const dragHandlers = dragHandlersRef?.current;

	return (
		<View className={ styles.SpinnerWrapper }>
			{ /* @ts-ignore Check PolymorphicComponent. No overload matches this call. */ }
			<HStack
				{ ...dragHandlers }
				className={ styles.Steppers }
				expanded={ true }
				spacing={ 0 }
				ref={ forwardedRef }
			>
				<UpDownArrows
					disabled={ disabled }
					onDecrement={ decrement }
					onIncrement={ increment }
				/>
			</HStack>
		</View>
	);
}

/**
 *
 * @typedef UpDownArrowsProps
 * @property {boolean | undefined} disabled Whether the controls are disabled.
 * @property {() => void} [onIncrement] Increment text input number value callback.
 * @property {() => void} [onDecrement] Decrement text input number value callback.
 */

/**
 *
 * @param {UpDownArrowsProps} props
 * @return {import('react').ReactElement} The _UpDownArrows component.
 */
const _UpDownArrows = ( {
	disabled,
	onIncrement = noop,
	onDecrement = noop,
} ) => {
	/** @type {import('react').MutableRefObject<number | undefined>} */
	const timeoutRef = useRef();
	const timeoutDurationStart = 500;
	const timeoutDurationEnd = 20;
	const timeoutDurationRef = useRef( timeoutDurationStart );

	const handleOnClearTimers = useCallback( () => {
		if ( timeoutRef.current ) {
			clearTimeout( timeoutRef.current );
		}
		timeoutDurationRef.current = timeoutDurationStart;
	}, [] );

	const handleOnMouseDownIncrement = useCallback(
		( event ) => {
			if ( event ) {
				event.preventDefault();
			}
			timeoutRef.current = setTimeout( () => {
				onIncrement();
				timeoutDurationRef.current = clamp(
					timeoutDurationRef.current / 2,
					timeoutDurationEnd,
					timeoutDurationStart
				);
				handleOnMouseDownIncrement();
			}, timeoutDurationRef.current );
		},
		[ onIncrement ]
	);

	const handleOnMouseDownDecrement = useCallback(
		( event ) => {
			if ( event ) {
				event.preventDefault();
			}
			timeoutRef.current = setTimeout( () => {
				onDecrement();
				timeoutDurationRef.current = clamp(
					timeoutDurationRef.current / 2,
					timeoutDurationEnd,
					timeoutDurationStart
				);
				handleOnMouseDownDecrement();
			}, timeoutDurationRef.current );
		},
		[ onDecrement ]
	);

	const handleOnIncrement = useCallback(
		( event ) => {
			event.stopPropagation();
			onIncrement();
		},
		[ onIncrement ]
	);

	const handleOnDecrement = useCallback(
		( event ) => {
			event.stopPropagation();
			onDecrement();
		},
		[ onDecrement ]
	);

	useEffect( () => {
		return () => handleOnClearTimers();
	}, [ handleOnClearTimers ] );

	return (
		<>
			<Icon
				as="button"
				className={ styles.SteppersUp }
				disabled={ disabled }
				onClick={ handleOnIncrement }
				onMouseDown={ handleOnMouseDownIncrement }
				onMouseLeave={ handleOnClearTimers }
				onMouseUp={ handleOnClearTimers }
				type="button"
				height={ `calc(100% - 4px)` }
				icon={ plus }
				size={ 12 }
				width={ 20 }
			/>
			<Icon
				as="button"
				className={ styles.SteppersDown }
				disabled={ disabled }
				onClick={ handleOnDecrement }
				onMouseDown={ handleOnMouseDownDecrement }
				onMouseLeave={ handleOnClearTimers }
				onMouseUp={ handleOnClearTimers }
				type="button"
				height={ `calc(100% - 4px)` }
				icon={ minus }
				size={ 12 }
				width={ 20 }
			/>
		</>
	);
};

const UpDownArrows = memo( _UpDownArrows );

export default memo( forwardRef( TextInputSteppers ) );
