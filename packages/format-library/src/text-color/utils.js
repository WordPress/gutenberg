/**
 * Returns the inline text color style for a highlight format.
 *
 * @param {Object} colors
 * @param {string} [colors.color]           The selected text color.
 * @param {string} [colors.backgroundColor] The selected background color.
 * @return {string|null} Inline color style or null when not needed.
 */
export function getHighlightTextColorStyle( { color, backgroundColor } ) {
	if ( color || ! backgroundColor ) {
		return null;
	}

	return 'color:inherit';
}
