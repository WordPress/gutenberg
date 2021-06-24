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
	__experimentalGetColorClassesAndStyles as getColorClassesAndStyles,
} from '@wordpress/block-editor';

/**
 * Internal dependencies
 */
import getWidthClassesAndStyles from './get-width-classes-and-styles';

export default function save( { attributes, className } ) {
	const { fontSize, linkTarget, rel, style, text, title, url } = attributes;

	if ( ! text ) {
		return null;
	}

	const borderRadius = style?.border?.radius;
	const colorProps = getColorClassesAndStyles( attributes );
	const buttonClasses = classnames(
		'wp-block-button__link',
		colorProps.className,
		{
			'no-border-radius': borderRadius === 0,
		}
	);
	const buttonStyle = {
		borderRadius: borderRadius ? borderRadius + 'px' : undefined,
		...colorProps.style,
	};

	// The use of a `title` attribute here is soft-deprecated, but still applied
	// if it had already been assigned, for the sake of backward-compatibility.
	// A title will no longer be assigned for new or updated button block links.

	const widthProps = getWidthClassesAndStyles( attributes );
	const wrapperClasses = classnames( className, widthProps.className, {
		[ `has-custom-font-size` ]: fontSize || style?.typography?.fontSize,
	} );

	return (
		<div
			{ ...useBlockProps.save( {
				className: wrapperClasses,
				style: widthProps.style,
			} ) }
		>
			<RichText.Content
				tagName="a"
				className={ buttonClasses }
				href={ url }
				title={ title }
				style={ buttonStyle }
				value={ text }
				target={ linkTarget }
				rel={ rel }
			/>
		</div>
	);
}
