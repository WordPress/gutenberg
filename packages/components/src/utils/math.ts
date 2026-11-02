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
 * Safely adds values together, handling floating-point precision issues.
 *
 * @param args Values to add together.
 *
 * @return The sum of values.
 */
export function add( ...args: Array< number | string > ) {
	const precision = args.length
		? Math.max( ...args.map( ( arg ) => getPrecision( getNumber( arg ) ) ) )
		: 0;
	const sum = args.reduce< number >(
		( total, arg ) => total + getNumber( arg ),
		0
	);
	return precision
		? getNumber( sum.toFixed( Math.min( precision, 20 ) ) )
		: sum;
}

/**
 * Safely subtracts values, handling floating-point precision issues.
 *
 * @param args Values to subtract together.
 *
 * @return The difference of the values.
 */
export function subtract( ...args: Array< number | string > ) {
	const precision = args.length
		? Math.max( ...args.map( ( arg ) => getPrecision( getNumber( arg ) ) ) )
		: 0;
	const diff = args.reduce< number >( ( total, arg, index ) => {
		const value = getNumber( arg );
		return index === 0 ? value : total - value;
	}, 0 );
	return precision
		? getNumber( diff.toFixed( Math.min( precision, 20 ) ) )
		: diff;
}

/**
 * Safely multiplies values together, handling floating-point precision issues.
 *
 * @param args Values to multiply together.
 *
 * @return The product of values.
 */
export function multiply( ...args: Array< number | string > ) {
	if ( ! args.length ) {
		return 0;
	}

	const precision = args.reduce< number >(
		( total, arg ) => total + getPrecision( getNumber( arg ) ),
		0
	);
	const product = args.reduce< number >( ( total, arg, index ) => {
		const value = getNumber( arg );
		return index === 0 ? value : total * value;
	}, 1 );

	return precision
		? getNumber( product.toFixed( Math.min( precision, 20 ) ) )
		: product;
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
