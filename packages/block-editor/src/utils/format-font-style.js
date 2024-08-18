/**
 * WordPress dependencies
 */
import { _x } from '@wordpress/i18n';

/**
 * Formats font styles to human readable names.
 *
 * @param {string} fontStyle font style string
 * @return {Object} new object with formatted font style
 */
export function formatFontStyle( fontStyle ) {
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
