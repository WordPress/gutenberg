import { minus, plus } from '@wordpress/icons';
import { ui } from '@wp-g2/styles';
import { clamp, noop } from 'lodash';
import React, { useCallback, useEffect, useRef } from 'react';

import { HStack } from '../HStack';
import { Icon } from '../Icon';
import { View } from '../View';
import * as styles from './styles';

/**
 * @typedef Props
 * @property {import('./use-text-input-state').TextInputState} __store
 * @property {boolean} disabled
 * @property {(int: number) => void} decrement
 * @property {(int: number) => void} increment
 */

/**
 *
 * @param {Props} props
 * @param {import('react').Ref<any>} forwardedRef
 */
function TextInputSteppers( props, forwardedRef ) {
	const { decrement, disabled, dragHandlersRef, increment } = props;
	const dragHandlers = dragHandlersRef.current;

	return (
		<View className={ styles.SpinnerWrapper }>
			<HStack
				{ ...dragHandlers }
				className={ styles.Steppers }
				expanded={ true }
				spacing={ 0 }
				{ ...ui.$( 'TextInputArrows' ) }
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
 * @param {object} props
 * @param {boolean} props.disabled
 * @param {(event?: import('react').KeyboardEvent) => void} props.onIncrement
 * @param {(event?: import('react').KeyboardEvent) => void} props.onDecrement
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
				{ ...ui.$( 'TextInputStepperUp' ) }
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
				{ ...ui.$( 'TextInputStepperDown' ) }
				height={ `calc(100% - 4px)` }
				icon={ minus }
				size={ 12 }
				width={ 20 }
			/>
		</>
	);
};

const UpDownArrows = React.memo( _UpDownArrows );

export default React.memo( React.forwardRef( TextInputSteppers ) );
