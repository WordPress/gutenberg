/**
 * External dependencies
 */
import { kebabCase } from 'lodash';
import classnames from 'classnames';

/**
 * Internal dependencies
 */
import { getInlineStyles } from './style';
import { getFontSizeClass } from '../components/font-sizes';
import { getComputedFluidTypographyValue } from '../components/font-sizes/fluid-utils';

// This utility is intended to assist where the serialization of the typography
// block support is being skipped for a block but the typography related CSS
// styles still need to be generated so they can be applied to inner elements.

/**
 * Provides the CSS class names and inline styles for a block's typography support
 * attributes.
 *
 * @param {Object}         attributes              Block attributes.
 * @param {Object|boolean} fluidTypographySettings If boolean, whether the function should try to convert font sizes to fluid values,
 *                                                 otherwise an object containing theme fluid typography settings.
 *
 * @return {Object} Typography block support derived CSS classes & styles.
 */
export function getTypographyClassesAndStyles(
	attributes,
	fluidTypographySettings
) {
	let typographyStyles = attributes?.style?.typography || {};

	if (
		!! fluidTypographySettings &&
		( true === fluidTypographySettings ||
			Object.keys( fluidTypographySettings ).length !== 0 )
	) {
		const newFontSize =
			getComputedFluidTypographyValue( {
				fontSize: attributes?.style?.typography?.fontSize,
				minimumFontSizeLimit: fluidTypographySettings?.minFontSize,
			} ) || attributes?.style?.typography?.fontSize;
		typographyStyles = {
			...typographyStyles,
			fontSize: newFontSize,
		};
	}

	const style = getInlineStyles( { typography: typographyStyles } );
	const fontFamilyClassName = !! attributes?.fontFamily
		? `has-${ kebabCase( attributes.fontFamily ) }-font-family`
		: '';

	const className = classnames(
		fontFamilyClassName,
		getFontSizeClass( attributes?.fontSize )
	);

	return {
		className,
		style,
	};
}
