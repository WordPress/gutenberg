/**
 * External dependencies
 */
import { clamp, noop } from 'lodash';

/**
 * WordPress dependencies
 */
import { useCallback, useRef, useEffect, useState } from '@wordpress/element';

/**
 * A float supported clamp function for a specific value.
 *
 * @param {number} value The value to clamp
 * @param {number} min The minimum value
 * @param {number} max The maxinum value
 * @return {number} A (float) number
 */
function floatClamp( value, min, max ) {
	return parseFloat( clamp( value, min, max ) );
}

/**
 * Hook to store a clamped value, derived from props.
 */
export function useControlledRangeValue( { min, max, value: valueProp = 0 } ) {
	const [ value, _setValue ] = useState( floatClamp( valueProp, min, max ) );
	const valueRef = useRef( value );

	const setValue = useCallback(
		( nextValue ) => {
			_setValue( floatClamp( nextValue, min, max ) );
		},
		[ _setValue, min, max ]
	);

	useEffect( () => {
		if ( valueRef.current !== valueProp ) {
			setValue( valueProp );
			valueRef.current = valueProp;
		}
	}, [ valueRef, valueProp, setValue ] );

	return [ value, setValue ];
}

/**
 * Hook to encapsulate the debouncing "hover" to better handle the showing
 * and hiding of the Tooltip.
 */
export function useDebouncedHoverInteraction( {
	onShow = noop,
	onHide = noop,
	onMouseEnter = noop,
	onMouseLeave = noop,
	timeout = 300,
} ) {
	const [ show, setShow ] = useState( false );
	const timeoutRef = useRef();

	const setDebouncedTimeout = useCallback(
		( callback ) => {
			if ( timeoutRef.current ) {
				window.clearTimeout( timeoutRef.current );
			}

			timeoutRef.current = setTimeout( callback, timeout );
		},
		[ timeout ]
	);

	const handleOnMouseEnter = useCallback( ( event ) => {
		onMouseEnter( event );

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

	return {
		onMouseEnter: handleOnMouseEnter,
		onMouseLeave: handleOnMouseLeave,
	};
}
