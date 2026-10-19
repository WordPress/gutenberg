import { getSpacingPresetCssVar } from '../components/spacing-sizes-control/utils';
import { normalizeLegacyLayout } from '../layouts/utils';
import type { Layout } from '../layouts/types';
import type { BlockGapValue } from './types';

/**
 * Returns whether the current layout can use separate row and column gaps.
 *
 * @param {?Object} layout        The block instance's layout attribute.
 * @param {?Object} defaultLayout The block's default supported layout.
 * @return {boolean} Whether axial block gap controls should be available.
 */
export function isAxialBlockGapAllowed(
	layout: Layout | null | undefined,
	defaultLayout?: Layout | null
): boolean {
	const usedLayout: Layout =
		normalizeLegacyLayout( layout ) || defaultLayout || {};

	return ( [ 'flex', 'grid' ] as ( string | undefined )[] ).includes(
		usedLayout?.type
	);
}

/**
 * Returns a BoxControl object value from a given blockGap style value.
 * The string check is for backwards compatibility before Gutenberg supported
 * split gap values (row and column) and the value was a string n + unit.
 *
 * @param {?string | ?Object} blockGapValue A block gap string or axial object value, e.g., '10px' or { top: '10px', left: '10px'}.
 * @return {Object|null}                    A value to pass to the BoxControl component.
 */
export function getGapBoxControlValueFromStyle(
	blockGapValue: BlockGapValue | null | undefined
): { top?: string; left?: string } | null {
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
export function getGapCSSValue(
	blockGapValue: BlockGapValue | null | undefined,
	defaultValue: string | null = '0'
): string | null {
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
