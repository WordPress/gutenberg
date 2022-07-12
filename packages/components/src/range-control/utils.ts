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

import type {
	UseControlledRangeValueArgs,
	UseDebouncedHoverInteractionArgs,
} from './types';

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
 * @param  settings
 * @return The controlled value and the value setter.
 */
export function useControlledRangeValue(
	settings: UseControlledRangeValueArgs
) {
	const { min, max, value: valueProp, initial } = settings;
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

	// `state` can't be an empty string because we specified a fallback value of
	// `null` in `useControlledState`
	return [ state as Exclude< typeof state, '' >, setState ] as const;
}

/**
 * Hook to encapsulate the debouncing "hover" to better handle the showing
 * and hiding of the Tooltip.
 *
 * @param  settings
 * @return Bound properties for use on a React.Node.
 */
export function useDebouncedHoverInteraction(
	settings: UseDebouncedHoverInteractionArgs
) {
	const {
		onHide = noop,
		onMouseLeave = noop as MouseEventHandler,
		onMouseMove = noop as MouseEventHandler,
		onShow = noop,
		timeout = 300,
	} = settings;

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
