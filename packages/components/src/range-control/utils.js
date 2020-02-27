/**
 * External dependencies
 */
import { clamp, isFinite, noop } from 'lodash';

/**
 * WordPress dependencies
 */
import { useCallback, useRef, useEffect, useState } from '@wordpress/element';

/**
 * A float supported clamp function for a specific value.
 *
 * @param {number|null} value The value to clamp
 * @param {number} min The minimum value
 * @param {number} max The maxinum value
 *
 * @return {number} A (float) number
 */
export function floatClamp( value, min, max ) {
	if ( ! isFinite( value ) ) {
		return null;
	}

	return parseFloat( clamp( value, min, max ) );
}

/**
 * Hook to store a clamped value, derived from props.
 */
export function useControlledRangeValue( { min, max, value: valueProp } ) {
	const [ value, setValue ] = useState( floatClamp( valueProp, min, max ) );
	const valueRef = useRef( value );

	const setClampValue = useCallback(
		( nextValue ) => {
			setValue( floatClamp( nextValue, min, max ) );
		},
		[ setValue, min, max ]
	);

	useEffect( () => {
		if ( valueRef.current !== valueProp ) {
			setClampValue( valueProp );
			valueRef.current = valueProp;
		}
	}, [ valueProp, setValue ] );

	return [ value, setValue ];
}

/**
 * Hook to encapsulate the debouncing "hover" to better handle the showing
 * and hiding of the Tooltip.
 */
export function useDebouncedHoverInteraction( {
	onShow = noop,
	onHide = noop,
	onMouseMove = noop,
	onMouseLeave = noop,
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
