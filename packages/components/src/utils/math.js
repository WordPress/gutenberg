/**
 * Parses and retrieves a number value.
 *
 * @param {unknown} value The incoming value.
 *
 * @return {number} The parsed number value.
 */
export function getNumber( value ) {
	const number = Number( value );

	return isNaN( number ) ? 0 : number;
}

/**
 * Safely adds 2 values.
 *
 * @param {Array<number|string>} args Values to add together.
 *
 * @return {number} The sum of values.
 */
export function add( ...args ) {
	return args.reduce(
		/** @type {(sum:number, arg: number|string) => number} */
		( sum, arg ) => sum + getNumber( arg ),
		0
	);
}

/**
 * Safely subtracts 2 values.
 *
 * @param {Array<number|string>} args Values to subtract together.
 *
 * @return {number} The difference of the values.
 */
export function subtract( ...args ) {
	return args.reduce(
		/** @type {(diff:number, arg: number|string, index:number) => number} */
		( diff, arg, index ) => {
			const value = getNumber( arg );
			return index === 0 ? value : diff - value;
		},
		0
	);
}

/**
 * Determines the decimal position of a number value.
 *
 * @param {number} value The number to evaluate.
 *
 * @return {number} The number of decimal places.
 */
function getPrecision( value ) {
	const split = ( value + '' ).split( '.' );
	return split[ 1 ] !== undefined ? split[ 1 ].length : 0;
}

/**
 * Clamps a value based on a min/max range.
 *
 * @param {number} value The value.
 * @param {number} min   The minimum range.
 * @param {number} max   The maximum range.
 *
 * @return {number} The clamped value.
 */
export function clamp( value, min, max ) {
	const baseValue = getNumber( value );
	return Math.max( min, Math.min( baseValue, max ) );
}

/**
 * Clamps a value based on a min/max range with rounding
 *
 * @param {number | string} value The value.
 * @param {number}          min   The minimum range.
 * @param {number}          max   The maximum range.
 * @param {number}          step  A multiplier for the value.
 *
 * @return {number} The rounded and clamped value.
 */
export function roundClamp(
	value = 0,
	min = Infinity,
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
 * @param {Parameters<typeof roundClamp>} args Arguments for roundClamp().
 * @return {string} The rounded and clamped value.
 */
export function roundClampString( ...args ) {
	return roundClamp( ...args ).toString();
}
