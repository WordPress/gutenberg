/**
 * External dependencies
 */
import { clamp } from 'lodash';

/**
 * Internal dependencies
 */
import { colorize, isColor } from '../colors';

/**
 * Interpolation from:
 * https://github.com/react-spring/react-spring/blob/master/src/animated/createInterpolator.ts
 */

/**
 * @param {number} input
 * @param {number[]} inputRange
 *
 * @return {number} The range value
 */
export function findRange( input, inputRange ) {
	// eslint-disable-next-line no-var
	for ( var i = 1; i < inputRange.length - 1; ++i )
		if ( inputRange[ i ] >= input ) break;
	return i - 1;
}

/**
 *
 * @param {number} [input=0]
 * @param {number} [inputMin=0]
 * @param {number} [inputMax=1]
 * @param {number} [outputMin=0]
 * @param {number} [outputMax=1]
 *
 * @return {number} The interpolated value.
 */
export function baseInterpolate(
	input = 0,
	inputMin = 0,
	inputMax = 1,
	outputMin = 0,
	outputMax = 1
) {
	let result = input;

	if ( outputMin === outputMax ) return outputMin;
	if ( inputMin === inputMax )
		return input <= inputMin ? outputMin : outputMax;

	// Input Range
	if ( inputMin === -Infinity ) result = -result;
	else if ( inputMax === Infinity ) result = result - inputMin;
	else result = ( result - inputMin ) / ( inputMax - inputMin );

	// Output Range
	if ( outputMin === -Infinity ) result = -result;
	else if ( outputMax === Infinity ) result = result + outputMin;
	else result = result * ( outputMax - outputMin ) + outputMin;

	let clampMin = outputMin;
	let clampMax = outputMax;

	if ( outputMax < outputMin ) {
		clampMin = outputMax;
		clampMax = outputMin;
	}

	return clamp( result, clampMin, clampMax );
}

/**
 * @param {number} [input=0]
 * @param {[number, number]} [inputRange=[0,1]]
 * @param {[number, number]} [outputRange=[0,1]]
 */
export function interpolate(
	input = 0,
	inputRange = [ 0, 1 ],
	outputRange = [ 0, 1 ]
) {
	const range = findRange( input, inputRange );
	const outputRange1 = outputRange[ range ];
	const outputRange2 = outputRange[ range + 1 ];

	if ( isColor( outputRange1 ) && isColor( outputRange2 ) ) {
		const mixAmount = interpolate( input, inputRange, [ 0, 100 ] );
		return colorize
			.mix( outputRange1.toString(), outputRange2.toString(), mixAmount )
			.toRgbString();
	}

	return baseInterpolate(
		input,
		inputRange[ range ],
		inputRange[ range + 1 ],
		outputRange1,
		outputRange2
	);
}

/**
 * @param {Parameters<interpolate>} args
 *
 * @return {number} The rounded interpolated value.
 */
export function interpolateRounded( ...args ) {
	return Math.round( interpolate( ...args ) );
}
