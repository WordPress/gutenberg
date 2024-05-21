/**
 * External dependencies
 */
import clsx from 'clsx';

/**
 * WordPress dependencies
 */
import { privateApis as componentsPrivateApis } from '@wordpress/components';

/**
 * Internal dependencies
 */
import { getInlineStyles } from './style';
import { getFontSizeClass } from '../components/font-sizes';
import { getTypographyFontSizeValue } from '../components/global-styles/typography-utils';
import { unlock } from '../lock-unlock';

const { kebabCase } = unlock( componentsPrivateApis );

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
	typographyStyles = {
		...typographyStyles,
		fontSize: getTypographyFontSizeValue(
			{ size: attributes?.style?.typography?.fontSize },
			settings
		),
	};

	const style = getInlineStyles( { typography: typographyStyles } );
	const fontFamilyClassName = !! attributes?.fontFamily
		? `has-${ kebabCase( attributes.fontFamily ) }-font-family`
		: '';
	const textAlignClassName = !! attributes?.style?.typography?.textAlign
		? `has-text-align-${ attributes?.style?.typography?.textAlign }`
		: '';
	const className = clsx(
		fontFamilyClassName,
		textAlignClassName,
		getFontSizeClass( attributes?.fontSize )
	);

	return {
		className,
		style,
	};
}
