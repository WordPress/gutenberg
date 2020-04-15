/**
 * External dependencies
 */
import { clamp } from 'lodash';

/**
 * WordPress dependencies
 */
import { useEffect } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { getRtl } from '../utils/style-mixins';

export function getDragCursor( dragDirection ) {
	const isRtl = getRtl();
	let dragCursor = 'n-resize';

	switch ( dragDirection ) {
		case 'n':
			dragCursor = 'n-resize';
			break;
		case 'e':
			dragCursor = isRtl ? 'w-resize' : 'e-resize';
			break;
		case 's':
			dragCursor = 's-resize';
			break;
		case 'w':
			dragCursor = isRtl ? 'e-resize' : 'w-resize';
			break;
	}

	return dragCursor;
}

export function useDragCursor( isDragging, dragDirection ) {
	const dragCursor = getDragCursor( dragDirection );

	useEffect( () => {
		if ( isDragging ) {
			document.documentElement.style.cursor = dragCursor;
			document.documentElement.style.pointerEvents = 'none';
		} else {
			document.documentElement.style.cursor = null;
			document.documentElement.style.pointerEvents = null;
		}
	}, [ isDragging ] );

	return dragCursor;
}

function getValue( value ) {
	const number = Number( value );

	return isNaN( number ) ? 0 : number;
}

export function add( a, b ) {
	return getValue( a ) + getValue( b );
}

export function subtract( a, b ) {
	return getValue( a ) - getValue( b );
}

export function roundClamp(
	value = 0,
	min = Infinity,
	max = Infinity,
	step = 1
) {
	const baseValue = getValue( value );
	const stepValue = getValue( step );
	const rounded = Math.round( baseValue / stepValue ) * stepValue;
	const clampedValue = clamp( rounded, min, max );

	return clampedValue;
}

export function roundClampString( ...args ) {
	return roundClamp( ...args ).toString();
}
