/**
 * External dependencies
 */
import { clamp } from 'lodash';

/**
 * WordPress dependencies
 */
import { useEffect } from '@wordpress/element';

export const DRAG_CURSOR = 'ns-resize';

export function useDragCursor( isDragging ) {
	useEffect( () => {
		if ( isDragging ) {
			document.documentElement.style.cursor = DRAG_CURSOR;
			document.documentElement.style.pointerEvents = 'none';
		} else {
			document.documentElement.style.cursor = null;
			document.documentElement.style.pointerEvents = null;
		}
	}, [ isDragging ] );
}

function getValue( value ) {
	const number = Number( value );
	return isNaN( number ) ? 0 : number;
}

export function add( a, b ) {
	return getValue( a ) + getValue( b );
}

export function roundClamp(
	value = 0,
	min = Infinity,
	max = Infinity,
	step = 1
) {
	const clampedValue = clamp( value, min, max );
	const rounded = Math.ceil( clampedValue / step ) * step;

	return rounded;
}

export function roundClampString( ...args ) {
	return roundClamp( ...args ).toString();
}
