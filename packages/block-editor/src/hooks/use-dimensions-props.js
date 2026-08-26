import { getInlineStyles } from './style';
import { isExplicitAspectRatio } from './dimensions';

// This utility is intended to assist where the serialization of the dimensions
// block support is being skipped for a block but the dimensions related CSS
// styles still need to be generated so they can be applied to inner elements.

/**
 * Provides the CSS class names and inline styles for a block's dimensions support
 * attributes.
 *
 * @param {Object} attributes Block attributes.
 * @return {Object} Dimensions block support derived CSS classes & styles.
 */
export function getDimensionsClassesAndStyles( attributes ) {
	const { style } = attributes;

	// Collect inline styles for dimensions.
	const dimensionsStyles = style?.dimensions || {};
	const styleProp = getInlineStyles( { dimensions: dimensionsStyles } );

	return {
		// Matches the dimensions support: `auto` is the default, not an
		// explicit ratio, so it does not get the class.
		className: isExplicitAspectRatio( dimensionsStyles.aspectRatio )
			? 'has-aspect-ratio'
			: undefined,
		style: styleProp,
	};
}
