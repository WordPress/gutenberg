/**
 * Returns whether the given width value is a percentage.
 *
 * @param {string} width - The width value.
 * @return {boolean} True if the width is a percentage value.
 */
export function isPercentageWidth( width ) {
	return typeof width === 'string' && width.endsWith( '%' );
}

/**
 * Returns the width classes for the button based on the width attribute.
 *
 * @param {string} width - The width value (e.g., '25%', '50%', '75%', '100%', or custom value).
 * @return {Object} Object with width-related class names as keys and true as values.
 */
export function getWidthClasses( width ) {
	if ( ! width ) {
		return {};
	}

	if ( isPercentageWidth( width ) ) {
		const legacyWidthClasses = {
			'25%': 'wp-block-button__width-25',
			'50%': 'wp-block-button__width-50',
			'75%': 'wp-block-button__width-75',
			'100%': 'wp-block-button__width-100',
		};
		return {
			'has-custom-width': true,
			'wp-block-button__width': true,
			// Maintain legacy class for backwards compatibility.
			...( legacyWidthClasses[ width ] && {
				[ legacyWidthClasses[ width ] ]: true,
			} ),
		};
	}

	return {
		'has-custom-width': true,
	};
}
