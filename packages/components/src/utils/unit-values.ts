/**
 * Parses a number and unit from a value.
 *
 * @param  toParse Value to parse
 *
 * @return  The extracted number and unit.
 */
export function parseUnitValue(
	toParse: string | number
): [ number | string | undefined, string | undefined ] {
	// eslint-disable-next-line eqeqeq
	if ( toParse == null ) {
		return [ undefined, undefined ];
	}

	const value = String( toParse ).trim();

	let num: number | string = parseFloat( value );
	num = Number.isNaN( num ) ? '' : num;

	const matched = value.match(
		/[\d.\-+]*\s*(cm|mm|Q|in|pc|pt|px|em|ex|ch|rem|lh|vw|vh|vmin|vmax)/
	);
	if ( ! matched ) {
		return [ undefined, undefined ];
	}
	const [ , unitMatch ] = matched;

	// eslint-disable-next-line eqeqeq
	const unit = unitMatch != null ? unitMatch : '';

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
export function createUnitValue(
	value: string | number,
	unit: string
): string {
	return `${ value }${ unit }`;
}
