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
 * Enables entry of out-of-range and invalid values that diverge from state.
 *
 * @param {Object}                 props          Props
 * @param {number|null}            props.value    Incoming value.
 * @param {number}                 props.max      Maximum valid value.
 * @param {number}                 props.min      Minimum valid value.
 * @param {(next: number) => void} props.onChange Callback for changes.
 *
 * @return {Object} Assorted props for the input.
 */
export function useUnimpededRangedNumberEntry( { max, min, onChange, value } ) {
	const ref = useRef();
	const isDiverging = useRef( false );
	/** @type {import('../input-control/types').InputChangeCallback}*/
	const changeHandler = ( next ) => {
		next = parseFloat( next );
		const isOverflow = next < min || next > max;
		isDiverging.current = isNaN( next ) || isOverflow;
		if ( isOverflow ) {
			next = Math.max( min, Math.min( max, next ) );
		}
		onChange( next );
	};
	useEffect( () => {
		if ( ref.current && isDiverging.current ) {
			const input = ref.current;
			const entry = input.value;
			const { defaultView } = input.ownerDocument;
			defaultView.requestAnimationFrame( () => ( input.value = entry ) );
			isDiverging.current = false;
		}
	}, [ value ] );

	return { max, min, ref, value, onChange: changeHandler };
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
