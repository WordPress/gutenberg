import clsx from 'clsx';
import { getTypographyFontSizeValue } from '@wordpress/global-styles-engine';
import { kebabCase } from '@wordpress/kebab-case';
import type {
	FontSizePreset,
	GlobalStylesSettings,
} from '@wordpress/global-styles-engine';
import { getInlineStyles } from './style';
import { getFontSizeClass } from '../components/font-sizes';
import type { TypographyAttributes } from './types';

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
export function getTypographyClassesAndStyles(
	attributes: TypographyAttributes | undefined,
	settings?: GlobalStylesSettings | boolean
) {
	let typographyStyles = attributes?.style?.typography || {};
	typographyStyles = {
		...typographyStyles,
		fontSize: getTypographyFontSizeValue(
			// It reads only the preset size.
			{ size: attributes?.style?.typography?.fontSize } as FontSizePreset,
			// It reads the settings optionally, so a boolean reads as none.
			settings as GlobalStylesSettings
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
