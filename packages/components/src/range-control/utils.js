// @ts-nocheck
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
 * @param {number|null} value The value to clamp.
 * @param {number}      min   The minimum value.
 * @param {number}      max   The maximum value.
 *
 * @return {number} A (float) number
 */
export function floatClamp( value, min, max ) {
	if ( typeof value !== 'number' ) {
		return null;
	}

	return parseFloat( clamp( value, min, max ) );
}

/**
 * Hook to encapsulate the debouncing "hover" to better handle the showing
 * and hiding of the Tooltip.
 *
 * @param {Object}   settings                     Hook settings.
 * @param {Function} [settings.onShow=noop]       A callback function invoked when the element is shown.
 * @param {Function} [settings.onHide=noop]       A callback function invoked when the element is hidden.
 * @param {Function} [settings.onMouseMove=noop]  A callback function invoked when the mouse is moved.
 * @param {Function} [settings.onMouseLeave=noop] A callback function invoked when the mouse is moved out of the element.
 * @param {number}   [settings.timeout=300]       Timeout before the element is shown or hidden.
 *
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
