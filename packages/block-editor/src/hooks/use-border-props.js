/**
 * Internal dependencies
 */
import { getInlineStyles } from './style';
import { getBorderClasses, getMultiOriginColor } from './border';
import useMultipleOriginColorsAndGradients from '../components/colors-gradients/use-multiple-origin-colors-and-gradients';

// This utility is intended to assist where the serialization of the border
// block support is being skipped for a block but the border related CSS classes
// & styles still need to be generated so they can be applied to inner elements.

/**
 * Provides the CSS class names and inline styles for a block's border support
 * attributes.
 *
 * @param {Object} attributes Block attributes.
 * @return {Object} Border block support derived CSS classes & styles.
 */
export function getBorderClassesAndStyles( attributes ) {
	const border = attributes.style?.border || {};
	const className = getBorderClasses( attributes );

	return {
		className: className || undefined,
		style: getInlineStyles( { border } ),
	};
}

/**
 * Derives the border related props for a block from its border block support
 * attributes.
 *
 * Inline styles are forced for named colors to ensure these selections are
 * reflected when themes do not load their color stylesheets in the editor.
 *
 * @param {Object} attributes Block attributes.
 *
 * @return {Object} ClassName & style props from border block support.
 */
export function useBorderProps( attributes ) {
	const { colors } = useMultipleOriginColorsAndGradients();
	const borderProps = getBorderClassesAndStyles( attributes );
	const { borderColor } = attributes;

	// Force inline styles to apply named border colors when themes do not load
	// their color stylesheets in the editor.
	if ( borderColor ) {
		const borderColorObject = getMultiOriginColor( {
			colors,
			namedColor: borderColor,
		} );

		borderProps.style.borderColor = borderColorObject.color;
	}

	return borderProps;
}
