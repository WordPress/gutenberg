import { chevronDown, chevronUp } from '@wordpress/icons';
import { ui } from '@wp-g2/styles';
import { clamp, noop } from 'lodash';
import React, { useCallback, useEffect, useRef } from 'react';

import { Icon } from '../Icon';
import { View } from '../View';
import { VStack } from '../VStack';
import * as styles from './styles';

/**
 * @typedef Props
 * @property {import('./useTextInputState').TextInputState} __store
 * @property {(int: number) => void} decrement
 * @property {(int: number) => void} increment
 */

/**
 *
 * @param {Props} props
 * @param {import('react').Ref<any>} forwardedRef
 */
function TextInputArrows( props, forwardedRef ) {
	const { decrement, dragHandlersRef, increment } = props;
	const dragHandlers = dragHandlersRef.current;

	return (
		<View className={ styles.SpinnerWrapper }>
			<VStack
				{ ...dragHandlers }
				className={ styles.Spinner }
				expanded={ true }
				spacing={ 0 }
				{ ...ui.$( 'TextInputArrows' ) }
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
				className={ styles.SpinnerArrowUp }
				onClick={ onIncrement }
				onMouseDown={ handleOnMouseDownIncrement }
				onMouseLeave={ handleOnClearTimers }
				onMouseUp={ handleOnClearTimers }
				tabIndex={ -1 }
				{ ...ui.$( 'TextInputArrowUp' ) }
				icon={ chevronUp }
				size={ 12 }
				width={ 16 }
			/>
			<Icon
				className={ styles.SpinnerArrowDown }
				onClick={ onDecrement }
				onMouseDown={ handleOnMouseDownDecrement }
				onMouseLeave={ handleOnClearTimers }
				onMouseUp={ handleOnClearTimers }
				tabIndex={ -1 }
				{ ...ui.$( 'TextInputArrowDown' ) }
				icon={ chevronDown }
				size={ 12 }
				width={ 16 }
			/>
		</>
	);
};

const UpDownArrows = React.memo( _UpDownArrows );

export default React.memo( React.forwardRef( TextInputArrows ) );
