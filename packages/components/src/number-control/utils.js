/**
 * WordPress dependencies
 */
import { useEffect } from '@wordpress/element';

export const DRAG_CURSOR = 'ns-resize';

export function useDragCursor( isDragging ) {
	useEffect( () => {
		if ( isDragging ) {
			document.documentElement.style.cursor = DRAG_CURSOR;
		} else {
			document.documentElement.style.cursor = null;
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
