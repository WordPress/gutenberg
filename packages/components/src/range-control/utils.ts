/**
 * External dependencies
 */
import type { MouseEventHandler } from 'react';

/**
 * WordPress dependencies
 */
import { useCallback, useRef, useEffect, useState } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { useControlledState } from '../utils/hooks';
import { clamp } from '../utils/math';

import type { useControlledRangeValueArgs } from './types';

const noop = () => {};

/**
 * A float supported clamp function for a specific value.
 *
 * @param  value The value to clamp.
 * @param  min   The minimum value.
 * @param  max   The maximum value.
 *
 * @return A (float) number
 */
export function floatClamp( value: number | null, min: number, max: number ) {
	if ( typeof value !== 'number' ) {
		return null;
	}

	return parseFloat( `${ clamp( value, min, max ) }` );
}

/**
 * Hook to store a clamped value, derived from props.
 *
 * @param  settings         Hook settings.
 * @param  settings.min     The minimum value.
 * @param  settings.max     The maximum value.
 * @param  settings.value   The current value.
 * @param  settings.initial The initial value.
 *
 * @return The controlled value and the value setter.
 */
export function useControlledRangeValue( {
	min,
	max,
	value: valueProp,
	initial,
}: useControlledRangeValueArgs ) {
	const [ state, setInternalState ] = useControlledState(
		floatClamp( valueProp, min, max ),
		{ initial, fallback: null }
	);

	const setState = useCallback(
		( nextValue: number | null ) => {
			if ( nextValue === null ) {
				setInternalState( null );
			} else {
				setInternalState( floatClamp( nextValue, min, max ) );
			}
		},
		[ min, max ]
	);

	return [ state, setState ] as const;
}

/**
 * Hook to encapsulate the debouncing "hover" to better handle the showing
 * and hiding of the Tooltip.
 *
 * @param  settings                     Hook settings.
 * @param  [settings.onShow=noop]       A callback function invoked when the element is shown.
 * @param  [settings.onHide=noop]       A callback function invoked when the element is hidden.
 * @param  [settings.onMouseMove=noop]  A callback function invoked when the mouse is moved.
 * @param  [settings.onMouseLeave=noop] A callback function invoked when the mouse is moved out of the element.
 * @param  [settings.timeout=300]       Timeout before the element is shown or hidden.
 *
 * @return Bound properties for use on a React.Node.
 */
export function useDebouncedHoverInteraction( {
	onHide = noop,
	onMouseLeave = noop as MouseEventHandler,
	onMouseMove = noop as MouseEventHandler,
	onShow = noop,
	timeout = 300,
} ) {
	const [ show, setShow ] = useState( false );
	const timeoutRef = useRef< number | undefined >();

	const setDebouncedTimeout = useCallback(
		( callback ) => {
			window.clearTimeout( timeoutRef.current );

			timeoutRef.current = window.setTimeout( callback, timeout );
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
