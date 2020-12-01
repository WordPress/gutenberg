/**
 * External dependencies
 */
import { clamp } from 'lodash';

/**
 * Internal dependencies
 */
import { getNumber, getPrecision } from './base';

/**
 * Clamps a value based on a min/max range with rounding
 *
 * @param {number} [value=0] The value.
 * @param {number} [min=-Infinity] The minimum range.
 * @param {number} [max=Infinity] The maximum range.
 * @param {number} [step=1] A multiplier for the value.
 *
 * @return {number} The rounded and clamped value.
 */
export function roundClamp(
	value = 0,
	min = -Infinity,
	max = Infinity,
	step = 1
) {
	const baseValue = getNumber( value );
	const stepValue = getNumber( step );
	const precision = getPrecision( step );
	const rounded = Math.round( baseValue / stepValue ) * stepValue;
	const clampedValue = clamp( rounded, min, max );

	return precision
		? getNumber( clampedValue.toFixed( precision ) )
		: clampedValue;
}

/**
 * Clamps a value based on a min/max range with rounding.
 * Returns a string.
 *
 * @param {Parameters<roundClamp>} args Arguments for roundClamp(). *
 *
 * @return {string} The rounded and clamped value.
 */
export function roundClampString( ...args ) {
	return roundClamp( ...args ).toString();
}
