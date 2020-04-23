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

/**
 * Gets a CSS cursor value based on a drag direction.
 *
 * @param {string} dragDirection The drag direction.
 * @return {string} The CSS cursor value.
 */
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

/**
 * Custom hook that renders a drag cursor when dragging.
 *
 * @param {boolean} isDragging The dragging state.
 * @param {string} dragDirection The drag direction.
 *
 * @return {string} The CSS cursor value.
 */
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

/**
 * Parses and retrieves a number value.
 *
 * @param {any} value The incoming value.
 * @return {number} The parsed number value.
 */
function getNumberValue( value ) {
	const number = Number( value );

	return isNaN( number ) ? 0 : number;
}

/**
 * Parses a value to safely store value state.
 *
 * @param {any} value The incoming value.
 * @return {number} The parsed number value.
 */
export function getValue( value ) {
	const parsedValue = parseFloat( value );

	return isNaN( parsedValue ) ? value : parsedValue;
}

/**
 * Safely adds 2 values.
 *
 * @param {any} a First value.
 * @param {any} b Second value.
 * @return {number} The sum of the 2 values.
 */
export function add( a, b ) {
	return getNumberValue( a ) + getNumberValue( b );
}

/**
 * Safely subtracts 2 values.
 *
 * @param {any} a First value.
 * @param {any} b Second value.
 * @return {number} The difference of the 2 values.
 */
export function subtract( a, b ) {
	return getNumberValue( a ) - getNumberValue( b );
}

/**
 * Clamps a value based on a min/max range with rounding
 *
 * @param {number} value The value.
 * @param {number} min The minimum range.
 * @param {number} max The maximum range.
 * @param {number} step A multiplier for the value.
 * @return {number} The rounded and clamped value.
 */
export function roundClamp(
	value = 0,
	min = Infinity,
	max = Infinity,
	step = 1
) {
	const baseValue = getNumberValue( value );
	const stepValue = getNumberValue( step );
	const rounded = Math.round( baseValue / stepValue ) * stepValue;
	const clampedValue = clamp( rounded, min, max );

	return clampedValue;
}

/**
 * Clamps a value based on a min/max range with rounding.
 * Returns a string.
 *
 * @param {any} args Arguments for roundClamp().
 * @property {number} value The value.
 * @property {number} min The minimum range.
 * @property {number} max The maximum range.
 * @property {number} step A multiplier for the value.
 * @return {string} The rounded and clamped value.
 */
export function roundClampString( ...args ) {
	return roundClamp( ...args ).toString();
}
