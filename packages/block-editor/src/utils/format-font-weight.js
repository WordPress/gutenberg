/**
 * WordPress dependencies
 */
import { _x } from '@wordpress/i18n';

/**
 * Formats font weights to human readable names.
 *
 * @param {string} fontWeight font weight string
 * @return {Object} new object with formatted font weight
 */
export function formatFontWeight( fontWeight ) {
	if ( ! fontWeight ) {
		return {};
	}

	if ( typeof fontWeight === 'object' ) {
		return fontWeight;
	}

	let name;

	switch ( fontWeight ) {
		case 'normal':
		case '400':
			name = _x( 'Regular', 'font weight' );
			break;
		case 'bold':
		case '700':
			name = _x( 'Bold', 'font weight' );
			break;
		case '100':
			name = _x( 'Thin', 'font weight' );
			break;
		case '200':
			name = _x( 'Extra Light', 'font weight' );
			break;
		case '300':
			name = _x( 'Light', 'font weight' );
			break;
		case '500':
			name = _x( 'Medium', 'font weight' );
			break;
		case '600':
			name = _x( 'Semi Bold', 'font weight' );
			break;
		case '800':
			name = _x( 'Extra Bold', 'font weight' );
			break;
		case '900':
			name = _x( 'Black', 'font weight' );
			break;
		case '1000':
			name = _x( 'Extra Black', 'font weight' );
			break;

		default:
			name = fontWeight;
			break;
	}

	return { name, value: fontWeight };
}
