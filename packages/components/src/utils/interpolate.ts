/**
 * Internal dependencies
 */
import { clamp } from './math';

/**
 * Interpolation from:
 * https://github.com/react-spring/react-spring/blob/master/src/animated/createInterpolator.ts
 */

function findRange( input: number, inputRange: number[] ): number {
	let i;
	for ( i = 1; i < inputRange.length - 1; ++i ) {
		if ( inputRange[ i ] >= input ) {
			break;
		}
	}
	return i - 1;
}

/**
 * Base interpolate function.
 *
 * @param {number} [input=0]
 * @param {number} [inputMin=0]
 * @param {number} [inputMax=1]
 * @param {number} [outputMin=0]
 * @param {number} [outputMax=1]
 *
 * @return {number} The interpolated value.
 */
function baseInterpolate(
	input: number = 0,
	inputMin: number = 0,
	inputMax: number = 1,
	outputMin: number = 0,
	outputMax: number = 1
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
 * Gets a value based on an input range and an output range.
 * Can be used for a set of numbers or a set of colors.
 *
 * @param {number}           [input=0]
 * @param {[number, number]} [inputRange=[0,1]]
 * @param {[number, number]} [outputRange=[0,1]]
 *
 * @return {number} The interpolated value.
 */
export function interpolate(
	input: number = 0,
	inputRange: [ number, number ] = [ 0, 1 ],
	outputRange: [ number, number ] = [ 0, 1 ]
) {
	const range = findRange( input, inputRange );
	const outputRange1 = outputRange[ range ];
	const outputRange2 = outputRange[ range + 1 ];

	return baseInterpolate(
		input,
		inputRange[ range ],
		inputRange[ range + 1 ],
		outputRange1,
		outputRange2
	);
}

/**
 * Gets a rounded value based on an input range and an output range.
 *
 * @param {Parameters<interpolate>} args
 *
 * @return {number} The rounded interpolated value.
 */
export function interpolateRounded(
	...args: [ number, [ number, number ], [ number, number ] ]
) {
	return Math.round( interpolate( ...args ) );
}
