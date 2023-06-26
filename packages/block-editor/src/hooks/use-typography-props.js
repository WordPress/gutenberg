/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * Internal dependencies
 */
import { getInlineStyles } from './style';
import { getFontSizeClass } from '../components/font-sizes';
import {
	getTypographyFontSizeValue,
	getFluidTypographyOptionsFromSettings,
} from '../components/global-styles/typography-utils';
import { kebabCase } from '../utils/object';

/*
 * This utility is intended to assist where the serialization of the typography
 * block support is being skipped for a block but the typography related CSS
 * styles still need to be generated so they can be applied to inner elements.
 */
/**
 * Provides the CSS class names and inline styles for a block's typography support
 * attributes.
 *
 * @param {Object}         attributes Block attributes.
 * @param {Object|boolean} settings   Merged theme.json settings
 *
 * @return {Object} Typography block support derived CSS classes & styles.
 */
export function getTypographyClassesAndStyles( attributes, settings ) {
	let typographyStyles = attributes?.style?.typography || {};
	const fluidTypographySettings =
		getFluidTypographyOptionsFromSettings( settings );

	typographyStyles = {
		...typographyStyles,
		fontSize: getTypographyFontSizeValue(
			{ size: attributes?.style?.typography?.fontSize },
			fluidTypographySettings
		),
	};

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
