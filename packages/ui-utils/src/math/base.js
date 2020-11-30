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
 * @param {Array<number|string|undefined>} args Values to add together.
 *
 * @return {number} The sum of values.
 */
export function add( ...args ) {
	return args.reduce(
		/** @type {(sum:number, arg: string | number | undefined) => number} */
		( sum, arg ) => sum + getNumber( arg ),
		0
	);
}

/**
 * Safely subtracts 2 values.
 *
 * @param {Array<number|string|undefined>} args Values to subtract together.
 *
 * @return {number} The difference of the 2 values.
 */
export function subtract( ...args ) {
	return /** @type {number[]} */ ( args ).reduce( ( diff, arg, index ) => {
		/** @type {number} */
		const value = getNumber( arg );
		return index === 0 ? value : /** @type {number} */ ( diff ) - value;
	} );
}

/**
 * Determines the decimal position of a number value.
 *
 * @param {number} value The number to evaluate.
 *
 * @return {number} The number of decimal places.
 */
export function getPrecision( value ) {
	const split = ( value + '' ).split( '.' );
	return split[ 1 ] !== undefined ? split[ 1 ].length : 0;
}
