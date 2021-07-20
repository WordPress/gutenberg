/**
 * We can't use Lodash here because it doesn't handle Infinity like we want
 *
 * @see https://github.com/you-dont-need/You-Dont-Need-Lodash-Underscore#_clamp
 * @param  number
 * @param  min
 * @param  max
 * @return The clamped value
 */
export const clamp = ( number: number, min?: number, max?: number ): number => {
	if ( min === Infinity && max === Infinity ) return number;
	if ( typeof max === 'undefined' ) {
		if ( typeof min === 'undefined' || number > min ) return number;
		return min;
	}

	if ( typeof min === 'undefined' ) {
		if ( typeof max === 'undefined' || number < max ) return number;
		return max;
	}

	// otherwise everything is defined
	if ( number < min ) return min;
	if ( number > max ) return max;
	return number;
};
