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
