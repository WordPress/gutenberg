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
		case '100':
			name = 'Thin';
			break;
		case '200':
			name = 'Extra Light';
			break;
		case '300':
			name = 'Light';
			break;
		case '400':
			name = 'Regular';
			break;
		case '500':
			name = 'Medium';
			break;
		case '600':
			name = 'Semi Bold';
			break;
		case '700':
			name = 'Bold';
			break;
		case '800':
			name = 'Extra Bold';
			break;
		case '900':
			name = 'Black';
			break;

		default:
			name = fontWeight;
			break;
	}

	return { name, value: fontWeight };
}
