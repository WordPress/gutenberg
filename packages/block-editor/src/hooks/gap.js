/**
 * Internal dependencies
 */
import { getSpacingPresetCssVar } from '../components/spacing-sizes-control/utils';

/**
 * Returns a BoxControl object value from a given blockGap style value.
 * The string check is for backwards compatibility before Gutenberg supported
 * split gap values (row and column) and the value was a string n + unit.
 *
 * @param {?string | ?Object} blockGapValue A block gap string or axial object value, e.g., '10px' or { top: '10px', left: '10px'}.
 * @return {Object|null}                    A value to pass to the BoxControl component.
 */
export function getGapBoxControlValueFromStyle( blockGapValue ) {
	if ( ! blockGapValue ) {
		return null;
	}

	const isValueString = typeof blockGapValue === 'string';
	return {
		top: isValueString ? blockGapValue : blockGapValue?.top,
		left: isValueString ? blockGapValue : blockGapValue?.left,
	};
}

/**
 * Returns a CSS value for the `gap` property from a given blockGap style.
 *
 * @param {?string | ?Object} blockGapValue A block gap string or axial object value, e.g., '10px' or { top: '10px', left: '10px'}.
 * @param {?string}           defaultValue  A default gap value.
 * @return {string|null}                    The concatenated gap value (row and column).
 */
export function getGapCSSValue( blockGapValue, defaultValue = '0' ) {
	const blockGapBoxControlValue =
		getGapBoxControlValueFromStyle( blockGapValue );
	if ( ! blockGapBoxControlValue ) {
		return null;
	}

	const row =
		getSpacingPresetCssVar( blockGapBoxControlValue?.top ) || defaultValue;
	const column =
		getSpacingPresetCssVar( blockGapBoxControlValue?.left ) || defaultValue;

	return row === column ? row : `${ row } ${ column }`;
}

/**
 * Split a CSS shorthand value by top-level whitespace only.
 *
 * @param {?string} value CSS shorthand value.
 * @return {string[]}     Top-level parts.
 */
export function splitTopLevelGapValues( value ) {
	if ( ! value ) {
		return [];
	}

	const parts = [];
	let current = '';
	let depth = 0;

	for ( const char of value ) {
		if ( char === '(' ) {
			depth++;
			current += char;
			continue;
		}

		if ( char === ')' ) {
			depth = Math.max( 0, depth - 1 );
			current += char;
			continue;
		}

		if ( /\s/.test( char ) && depth === 0 ) {
			if ( current ) {
				parts.push( current );
				current = '';
			}
			continue;
		}

		current += char;
	}

	if ( current ) {
		parts.push( current );
	}

	return parts;
}

/**
 * Returns a CSS value for the `gap` property with fallback support.
 *
 * @param {?string | ?Object} blockGapValue A block gap string or axial object value, e.g., '10px' or { top: '10px', left: '10px'}.
 * @param {?string}           fallbackValue A fallback gap value, which may be a shorthand string.
 * @return {string|null}                    The concatenated gap value (row and column).
 */
export function getGapValueWithFallback( blockGapValue, fallbackValue = '0' ) {
	const blockGapBoxControlValue =
		getGapBoxControlValueFromStyle( blockGapValue );

	if ( ! blockGapBoxControlValue ) {
		return null;
	}

	const fallbackParts = splitTopLevelGapValues( fallbackValue );

	const fallbackTop = fallbackParts[ 0 ] || fallbackValue;
	const fallbackLeft =
		fallbackParts[ 1 ] || fallbackParts[ 0 ] || fallbackValue;

	const row =
		getSpacingPresetCssVar( blockGapBoxControlValue?.top ) || fallbackTop;
	const column =
		getSpacingPresetCssVar( blockGapBoxControlValue?.left ) || fallbackLeft;

	return row === column ? row : `${ row } ${ column }`;
}
