/**
 * External dependencies
 */
import { clamp, noop } from 'lodash';

/**
 * WordPress dependencies
 */
import { useCallback, useRef, useEffect, useState } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { useControlledState } from '../utils/hooks';

/**
 * A float supported clamp function for a specific value.
 *
 * @param {number|null} value The value to clamp
 * @param {number} min The minimum value
 * @param {number} max The maxinum value
 * @return {number} A (float) number
 */
export function floatClamp( value, min, max ) {
	if ( typeof value !== 'number' ) {
		return null;
	}

	return parseFloat( clamp( value, min, max ) );
}

/**
 * Hook to store a clamped value, derived from props.
 *
 * @param {Object} props Properties for the hook.
 * @param {number} props.min The minimum value.
 * @param {number} props.max The maximum value.
 * @param {number} props.value The current value.
 * @return {[*, Function]} The controlled value and the value setter.
 */
export function useControlledRangeValue( { min, max, value: valueProp } ) {
	const [ value, setValue ] = useControlledState(
		floatClamp( valueProp, min, max )
	);

	const setClampValue = useCallback(
		( nextValue ) => {
			if ( nextValue === null ) {
				setValue( null );
			} else {
				setValue( floatClamp( nextValue, min, max ) );
			}
		},
		[ min, max ]
	);

	return [ value, setClampValue ];
}

/**
 * Hook to encapsulate the debouncing "hover" to better handle the showing
 * and hiding of the Tooltip.
 *
 * @param {Object} props Properties for the hook.
 * @param {Function} props.onHide Callback function on hide.
 * @param {Function} props.onMouseLeave Callback function on a mouseleave event.
 * @param {Function} props.onMouseMove Callback function on a mousemove event.
 * @param {Function} props.onShow Callback function on show.
 * @param {number} props.timeout Timeout duration for hover interaction.
 * @return {Object} Bound properties for use on a React.Node.
 */
export function useDebouncedHoverInteraction( {
	onHide = noop,
	onMouseLeave = noop,
	onMouseMove = noop,
	onShow = noop,
	timeout = 300,
} ) {
	const [ show, setShow ] = useState( false );
	const timeoutRef = useRef();

	const setDebouncedTimeout = useCallback(
		( callback ) => {
			window.clearTimeout( timeoutRef.current );

			timeoutRef.current = setTimeout( callback, timeout );
		},
		[ timeout ]
	);

	const handleOnMouseMove = useCallback( ( event ) => {
		onMouseMove( event );

		setDebouncedTimeout( () => {
			if ( ! show ) {
				setShow( true );
				onShow();
			}
		} );
	}, [] );

	const handleOnMouseLeave = useCallback( ( event ) => {
		onMouseLeave( event );

		setDebouncedTimeout( () => {
			setShow( false );
			onHide();
		} );
	}, [] );

	useEffect( () => {
		return () => {
			window.clearTimeout( timeoutRef.current );
		};
	} );

	return {
		onMouseMove: handleOnMouseMove,
		onMouseLeave: handleOnMouseLeave,
	};
}
