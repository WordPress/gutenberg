import {
	getDimensionPresetCssVar,
	privateApis as globalStylesEnginePrivateApis,
} from '@wordpress/global-styles-engine';
import { unlock } from '../lock-unlock';

const { isColumnFillWidth } = unlock( globalStylesEnginePrivateApis );

const PRESET_PREFIX = 'var:preset|dimension|';
const FILL_STYLE = { flexBasis: '0', flexGrow: '1' };

/**
 * Converts a column width into the inline style that sizes the column within
 * its flex container.
 *
 * Only a filling column needs `flex-grow` inline. Every other width is already
 * stopped from growing by the `[style*="flex-basis"]` rule in the Columns
 * block's stylesheet, and leaving it out keeps existing markup unchanged.
 *
 * @param {string|number|undefined} width Column width.
 *
 * @return {Object|undefined} Style object, or undefined when there is no width.
 */
export function getColumnStyle( width ) {
	// Numbers are handled for backward compatibility as they can still be
	// provided by templates and patterns. Zero has always meant no width.
	if ( Number.isFinite( width ) ) {
		return width ? { flexBasis: `${ width }%` } : undefined;
	}

	if ( typeof width !== 'string' || ! width ) {
		return undefined;
	}

	if ( isColumnFillWidth( width ) ) {
		return FILL_STYLE;
	}

	if ( width.startsWith( PRESET_PREFIX ) ) {
		return { flexBasis: getDimensionPresetCssVar( width ) };
	}

	if ( ! /\d/.test( width ) ) {
		return undefined;
	}

	if ( width.endsWith( '%' ) ) {
		// In some cases we need to round the width to a shorter float.
		const multiplier = 1000000000000;
		return {
			flexBasis: `${
				Math.round( Number.parseFloat( width ) * multiplier ) /
				multiplier
			}%`,
		};
	}

	return { flexBasis: width };
}
