/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * Internal dependencies
 */
import { getInlineStyles } from './style';
import {
	getColorClassName,
	getColorObjectByAttributeValues,
} from '../components/colors';
import useSetting from '../components/use-setting';

// This utility is intended to assist where the serialization of the border
// block support is being skipped for a block but the border related CSS classes
// & styles still need to be generated so they can be applied to inner elements.

const EMPTY_ARRAY = [];

/**
 * Provides the CSS class names and inline styles for a block's border support
 * attributes.
 *
 * @param  {Object} attributes             Block attributes.
 * @param  {string} attributes.borderColor Selected named border color.
 * @param  {Object} attributes.style       Block's styles attribute.
 *
 * @return {Object} Border block support derived CSS classes & styles.
 */
export function getBorderClassesAndStyles( { borderColor, style } ) {
	const borderStyles = style?.border || {};
	const borderClass = getColorClassName( 'border-color', borderColor );

	const className = classnames( {
		[ borderClass ]: !! borderClass,
		'has-border-color': borderColor || style?.border?.color,
	} );

	return {
		className: className || undefined,
		style: getInlineStyles( { border: borderStyles } ),
	};
}

/**
 * Derives the border related props for a block from its border block support
 * attributes.
 *
 * Inline styles are forced for named colors to ensure these selections are
 * reflected when themes do not load their color stylesheets in the editor.
 *
 * @param  {Object} attributes Block attributes.
 * @return {Object}            ClassName & style props from border block support.
 */
export function useBorderProps( attributes ) {
	const colors = useSetting( 'color.palette' ) || EMPTY_ARRAY;
	const borderProps = getBorderClassesAndStyles( attributes );

	// Force inline style to apply border color when themes do not load their
	// color stylesheets in the editor.
	if ( attributes.borderColor ) {
		const borderColorObject = getColorObjectByAttributeValues(
			colors,
			attributes.borderColor
		);

		borderProps.style.borderColor = borderColorObject.color;
	}

	return borderProps;
}
