/**
 * External dependencies
 */
import { kebabCase } from 'lodash';

/**
 * Internal dependencies
 */
import { getInlineStyles } from './style';

// This utility is intended to assist where the serialization of the typography
// block support is being skipped for a block but the spacing related CSS
// styles still need to be generated so they can be applied to inner elements.

/**
 * Provides the CSS class names and inline styles for a block's typography support
 * attributes.
 *
 * @param {Object} attributes Block attributes.
 *
 * @return {Object} Typography block support derived CSS classes & styles.
 */
export function getTypographyClassesAndStyles( attributes ) {
	// Collect inline styles for typography.
	const typographyStyles = attributes?.style?.typography || {};
	const style = getInlineStyles( { typography: typographyStyles } );
	const className = !! attributes?.fontFamily
		? `has-${ kebabCase( attributes.fontFamily ) }-font-family`
		: '';
	return {
		className,
		style,
	};
}
