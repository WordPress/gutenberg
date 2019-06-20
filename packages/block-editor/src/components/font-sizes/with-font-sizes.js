/**
 * WordPress dependencies
 */
import { createHigherOrderComponentWithMergeProps } from '@wordpress/compose';

/**
 * Internal dependencies
 */
import useFontSizes from './use-font-sizes';

/**
 * Higher-order component, which handles font size logic for class generation,
 * font size value retrieval, and font size change handling.
 *
 * @param {...string} fontSizeNames The arguments should all be strings.
 *                                   Each string contains the font size attribute name e.g.: 'fontSize'.
 *
 * @return {Function} Higher-order component.
 */
export default function withFontSizes( ...fontSizeNames ) {
	return createHigherOrderComponentWithMergeProps(
		() => useFontSizes( fontSizeNames ),
		'withFontSizes'
	);
}
