// @ts-nocheck
/**
 * External dependencies
 */
import { noop } from 'lodash';

/**
 * WordPress dependencies
 */
import { useCallback, useRef, useEffect, useState } from '@wordpress/element';

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
		if ( next < min || next > max ) {
			isDiverging.current = true;
			next = Math.max( min, Math.min( max, next ) );
		}
		onChange( next );
	};
	// When the value entered in the input is out of range then a clamped value
	// is sent through onChange and that goes on to update the input. In such
	// circumstances this effect overwrites the input value with the entered
	// value to avoid interfering with typing. E.g. Without this effect, if
	// `min` is 20 and the user intends to type 25, as soon as 2 is typed the
	// input will update to 20 and likely lead to an entry of 205.
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
