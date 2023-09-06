/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import {
	RichText,
	useBlockProps,
	__experimentalGetBorderClassesAndStyles as getBorderClassesAndStyles,
	__experimentalGetColorClassesAndStyles as getColorClassesAndStyles,
	__experimentalGetSpacingClassesAndStyles as getSpacingClassesAndStyles,
	__experimentalGetElementClassName,
} from '@wordpress/block-editor';

export default function save( { attributes, className } ) {
	const {
		tagName,
		textAlign,
		fontSize,
		linkTarget,
		rel,
		style,
		text,
		title,
		url,
		width,
	} = attributes;

	if ( ! text ) {
		return null;
	}

	const TagName = tagName || 'a';
	const borderProps = getBorderClassesAndStyles( attributes );
	const colorProps = getColorClassesAndStyles( attributes );
	const spacingProps = getSpacingClassesAndStyles( attributes );
	const buttonClasses = classnames(
		'wp-block-button__link',
		colorProps.className,
		borderProps.className,
		{
			[ `has-text-align-${ textAlign }` ]: textAlign,
			// For backwards compatibility add style that isn't provided via
			// block support.
			'no-border-radius': style?.border?.radius === 0,
		},
		__experimentalGetElementClassName( 'button' )
	);
	const buttonStyle = {
		...borderProps.style,
		...colorProps.style,
		...spacingProps.style,
	};

	// The use of a `title` attribute here is soft-deprecated, but still applied
	// if it had already been assigned, for the sake of backward-compatibility.
	// A title will no longer be assigned for new or updated button block links.

	const wrapperClasses = classnames( className, {
		[ `has-custom-width wp-block-button__width-${ width }` ]: width,
		[ `has-custom-font-size` ]: fontSize || style?.typography?.fontSize,
	} );

	return (
		<div { ...useBlockProps.save( { className: wrapperClasses } ) }>
			<RichText.Content
				tagName={ TagName }
				className={ buttonClasses }
				href={ 'button' === TagName ? null : url }
				title={ title }
				style={ buttonStyle }
				value={ text }
				target={ 'button' === TagName ? null : linkTarget }
				rel={ 'button' === TagName ? null : rel }
			/>
		</div>
	);
}
