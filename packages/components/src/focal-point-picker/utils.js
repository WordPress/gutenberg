/**
 * External dependencies
 */
import { clamp } from 'lodash';

const VIDEO_EXTENSIONS = [ 'm4v', 'avi', 'mpg', 'mp4', 'webm', 'ogg' ];

export function getExtension( filename = '' ) {
	const parts = filename.split( '.' );
	return parts[ parts.length - 1 ];
}

export function isVideoType( filename = '' ) {
	if ( ! filename ) return false;
	return VIDEO_EXTENSIONS.includes( getExtension( filename ) );
}

export function fractionToPercentage( fraction ) {
	return Math.round( fraction * 100 );
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
	const rounded = Math.round( value / step ) * step;
	const clampedValue = clamp( rounded, min, max );

	return clampedValue;
}
