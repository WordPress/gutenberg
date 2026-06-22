/**
 * WordPress dependencies
 */
import { _x } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import type { FormattedFont } from './types';

/**
 * Formats font styles to human readable names.
 *
 * @param fontStyle font style string
 * @return new object with formatted font style
 */
export function formatFontStyle(
	fontStyle: FormattedFont | string | undefined
): FormattedFont {
	if ( ! fontStyle ) {
		return {};
	}

	if ( typeof fontStyle === 'object' ) {
		return fontStyle;
	}

	let name;

	switch ( fontStyle ) {
		case 'normal':
			name = _x( 'Regular', 'font style' );
			break;
		case 'italic':
			name = _x( 'Italic', 'font style' );
			break;
		case 'oblique':
			name = _x( 'Oblique', 'font style' );
			break;

		default:
			name = fontStyle;
			break;
	}

	return { name, value: fontStyle };
}
