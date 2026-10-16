/**
 * Parses and retrieves a number value.
 *
 * @param value The incoming value.
 *
 * @return The parsed number value.
 */
export function getNumber( value: unknown ) {
	const number = Number( value );

	return isNaN( number ) ? 0 : number;
}

/**
 * Safely adds 2 values.
 *
 * @param args Values to add together.
 *
 * @return The sum of values.
 */
export function add( ...args: Array< number | string > ) {
	return args.reduce< number >( ( sum, arg ) => sum + getNumber( arg ), 0 );
}

/**
 * Safely subtracts 2 values.
 *
 * @param args Values to subtract together.
 *
 * @return The difference of the values.
 */
export function subtract( ...args: Array< number | string > ) {
	return args.reduce< number >( ( diff, arg, index ) => {
		const value = getNumber( arg );
		return index === 0 ? value : diff - value;
	}, 0 );
}

/**
 * Determines the decimal position of a number value.
 *
 * @param value The number to evaluate.
 *
 * @return The number of decimal places.
 */
function getPrecision( value: number ) {
	const split = ( value + '' ).split( '.' );
	return split[ 1 ] !== undefined ? split[ 1 ].length : 0;
}

/**
 * Clamps a value based on a min/max range.
 *
 * @param value The value.
 * @param min   The minimum range.
 * @param max   The maximum range.
 *
 * @return The clamped value.
 */
export function clamp( value: number | string, min: number, max: number ) {
	const baseValue = getNumber( value );
	return Math.max( min, Math.min( baseValue, max ) );
}

/**
 * Rounds a value to the nearest step offset by a minimum.
 *
 * @param value The value.
 * @param min   The minimum range.
 * @param step  The increment for the value.
 *
 * @return The value as a valid step.
 */
export function ensureValidStep(
	value: number | string,
	min: number,
	step: number
) {
	const baseValue = getNumber( value );
	const minValue = getNumber( min );
	const stepValue = getNumber( step );
	const precision = Math.max( getPrecision( step ), getPrecision( min ) );
	// If the step is not a factor of the minimum then the step must be
	// offset by the minimum.
	const tare = minValue % stepValue ? minValue : 0;
	const rounded = Math.round( ( baseValue - tare ) / stepValue ) * stepValue;
	const fromMin = rounded + tare;
	return precision ? getNumber( fromMin.toFixed( precision ) ) : fromMin;
}
