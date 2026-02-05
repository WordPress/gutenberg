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
	const legacyPercentageWidths = [ '25%', '50%', '75%', '100%' ];

	if ( ! width ) {
		return {};
	}

	if ( isPercentageWidth( width ) ) {
		const numericWidth = parseInt( width, 10 );
		return {
			'has-custom-width': true,
			'wp-block-button__width': true,
			// Maintain legacy class for backwards compatibility.
			...( legacyPercentageWidths.includes( width )
				? { [ `wp-block-button__width-${ numericWidth }` ]: true }
				: {} ),
		};
	}

	return {
		'has-custom-width': true,
	};
}
