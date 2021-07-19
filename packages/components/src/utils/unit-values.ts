/**
 * External dependencies
 */
import { isNil } from 'lodash';

const UNITED_VALUE_REGEX = /[\d.\-+]*\s*(fr|cm|mm|Q|in|pc|pt|px|em|ex|ch|rem|lh|vw|vh|vmin|vmax|%|cap|ic|rlh|vi|vb|deg|grad|rad|turn|s|ms|Hz|kHz|dpi|dpcm|dppx)$/;

/**
 * Parses a number and unit from a value.
 *
 * @param  toParse Value to parse
 *
 * @return  The extracted number and unit.
 */
export function parseCSSUnitValue(
	toParse: string | number
): [ number | undefined, string | undefined ] {
	if ( isNil( toParse ) ) {
		return [ undefined, undefined ];
	}

	const value = String( toParse ).trim();

	let num: number | undefined = parseFloat( value );
	num = Number.isNaN( num ) ? undefined : num;

	const matched = value.match( UNITED_VALUE_REGEX );
	if ( ! matched ) {
		return [ num, undefined ];
	}
	const [ , unit ] = matched;

	return [ num, unit ];
}

/**
 * Combines a value and a unit into a unit value.
 *
 * @param  value
 * @param  unit
 *
 * @return The unit value.
 */
export function createCSSUnitValue(
	value: string | number,
	unit: string
): string {
	return `${ value }${ unit }`;
}
