/**
 * External dependencies
 */
import { clamp, noop } from 'lodash';

/**
 * WordPress dependencies
 */
import { chevronDown, chevronUp } from '@wordpress/icons';
import {
	useCallback,
	useEffect,
	memo,
	forwardRef,
	useRef,
} from '@wordpress/element';
import { useI18n } from '@wordpress/react-i18n';

/**
 * Internal dependencies
 */
import Icon from '../icon';
import { View } from '../view';
import { VStack } from '../v-stack';
import * as styles from './styles';
import { useCx } from '../utils/hooks';

/**
 * @typedef Props
 * @property {import('react').MutableRefObject<import('./hooks/use-base-drag-handlers').UseBaseDragHandlersProps>} [dragHandlersRef] Drag handler React ref.
 * @property {() => void}                                                                                          [increment]       Increment text input number value callback.
 * @property {() => void}                                                                                          [decrement]       Decrement text input number value callback.
 */

/**
 *
 * @param {Props}                    props
 * @param {import('react').Ref<any>} forwardedRef
 */
function TextInputArrows( props, forwardedRef ) {
	const { decrement, dragHandlersRef, increment } = props;
	const dragHandlers = dragHandlersRef?.current;
	const cx = useCx();

	return (
		<View className={ cx( styles.SpinnerWrapper ) }>
			<VStack
				{ ...dragHandlers }
				className={ cx( styles.Spinner ) }
				expanded={ true }
				spacing={ 0 }
				ref={ forwardedRef }
			>
				<UpDownArrows
					onDecrement={ decrement }
					onIncrement={ increment }
				/>
			</VStack>
		</View>
	);
}

const _UpDownArrows = ( { onIncrement = noop, onDecrement = noop } ) => {
	/** @type {import('react').MutableRefObject<number | undefined>} */
	const timeoutRef = useRef();
	const timeoutDurationStart = 500;
	const timeoutDurationEnd = 20;
	const timeoutDurationRef = useRef( timeoutDurationStart );
	const cx = useCx();
	const { __ } = useI18n();

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

	useEffect( () => {
		return () => handleOnClearTimers();
	}, [ handleOnClearTimers ] );

	return (
		<>
			<Icon
				className={ cx( styles.SpinnerArrowUp ) }
				aria-label={ __( 'Increment' ) }
				role="button"
				onClick={ onIncrement }
				onMouseDown={ handleOnMouseDownIncrement }
				onMouseLeave={ handleOnClearTimers }
				onMouseUp={ handleOnClearTimers }
				tabIndex={ -1 }
				icon={ chevronUp }
				size={ 12 }
				width={ 16 }
			/>
			<Icon
				className={ cx( styles.SpinnerArrowDown ) }
				aria-label={ __( 'Decrement' ) }
				role="button"
				onClick={ onDecrement }
				onMouseDown={ handleOnMouseDownDecrement }
				onMouseLeave={ handleOnClearTimers }
				onMouseUp={ handleOnClearTimers }
				tabIndex={ -1 }
				icon={ chevronDown }
				size={ 12 }
				width={ 16 }
			/>
		</>
	);
};

const UpDownArrows = memo( _UpDownArrows );

export default memo( forwardRef( TextInputArrows ) );
