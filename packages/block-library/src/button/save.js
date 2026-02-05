/**
 * External dependencies
 */
import clsx from 'clsx';

/**
 * WordPress dependencies
 */
import {
	RichText,
	useBlockProps,
	__experimentalGetBorderClassesAndStyles as getBorderClassesAndStyles,
	__experimentalGetColorClassesAndStyles as getColorClassesAndStyles,
	__experimentalGetSpacingClassesAndStyles as getSpacingClassesAndStyles,
	__experimentalGetShadowClassesAndStyles as getShadowClassesAndStyles,
	__experimentalGetDimensionsClassesAndStyles as getDimensionsClassesAndStyles,
	__experimentalGetElementClassName,
	getTypographyClassesAndStyles,
} from '@wordpress/block-editor';

/**
 * Internal dependencies
 */
import { getWidthClasses, isPercentageWidth } from './utils';

export default function save( { attributes, className } ) {
	const {
		tagName,
		type,
		fontSize,
		linkTarget,
		rel,
		style,
		text,
		title,
		url,
	} = attributes;
	const { width } = style?.dimensions || {};

	const TagName = tagName || 'a';
	const isButtonTag = 'button' === TagName;
	const buttonType = type || 'button';
	const borderProps = getBorderClassesAndStyles( attributes );
	const colorProps = getColorClassesAndStyles( attributes );
	const spacingProps = getSpacingClassesAndStyles( attributes );
	const shadowProps = getShadowClassesAndStyles( attributes );
	const dimensionsProps = getDimensionsClassesAndStyles( attributes );
	const typographyProps = getTypographyClassesAndStyles( attributes );
	const buttonClasses = clsx(
		'wp-block-button__link',
		colorProps.className,
		borderProps.className,
		typographyProps.className,
		{
			// For backwards compatibility add style that isn't provided via
			// block support.
			'no-border-radius': style?.border?.radius === 0,
			[ `has-custom-font-size` ]: fontSize || style?.typography?.fontSize,
		},
		__experimentalGetElementClassName( 'button' )
	);
	const buttonStyle = {
		...borderProps.style,
		...colorProps.style,
		...spacingProps.style,
		...shadowProps.style,
		...typographyProps.style,
		writingMode: undefined,
	};

	// The use of a `title` attribute here is soft-deprecated, but still applied
	// if it had already been assigned, for the sake of backward-compatibility.
	// A title will no longer be assigned for new or updated button block links.

	const wrapperClasses = clsx( className, getWidthClasses( width ) );

	// Apply width styles to wrapper
	let wrapperStyle = {};
	if ( width ) {
		wrapperStyle = isPercentageWidth( width )
			? { '--wp--block-button--width': parseInt( width, 10 ) }
			: dimensionsProps.style;
	}

	return (
		<div
			{ ...useBlockProps.save( {
				className: wrapperClasses,
				style: wrapperStyle,
			} ) }
		>
			<RichText.Content
				tagName={ TagName }
				type={ isButtonTag ? buttonType : null }
				className={ buttonClasses }
				href={ isButtonTag ? null : url }
				title={ title }
				style={ buttonStyle }
				value={ text }
				target={ isButtonTag ? null : linkTarget }
				rel={ isButtonTag ? null : rel }
			/>
		</div>
	);
}
