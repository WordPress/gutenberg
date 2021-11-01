/**
 * External dependencies
 */
import classnames from 'classnames';
import { kebabCase } from 'lodash';

/**
 * Internal dependencies
 */
import { getInlineStyles } from './style';
import { getFontSizeClass } from '../components/font-sizes';

// This utility is intended for use where the serialization of the typography
// block support styles is being skipped for a block but the typography related
// CSS classes & styles still need to be generated so they can be applied to
// inner elements.

/**
 * Provides the CSS class names and inline styles for a block's typography
 * support attributes.
 *
 * @param {Object} attributes            Block attributes.
 * @param {Object} attributes.fontFamily Block attributes named font family selection.
 * @param {Object} attributes.fontSize   Block attributes named font size selection.
 * @param {Object} attributes.style      Block's styles attribute.
 *
 * @return {Object} Typography block support derived CSS classes & styles.
 */
export function getTypographyClassesAndStyles( {
	fontFamily,
	fontSize,
	style,
} ) {
	const typographyStyles = style?.typography || {};
	const fontFamilyClass = `has-${ kebabCase( fontFamily ) }-font-family`;
	const fontSizeClass = getFontSizeClass( fontSize );

	const className = classnames( {
		[ fontFamilyClass ]: !! fontFamily,
		[ fontSizeClass ]: !! fontSize,
	} );

	return {
		className: className || undefined,
		style: getInlineStyles( { typography: typographyStyles } ),
	};
}
