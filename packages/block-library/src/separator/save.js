/**
 * External dependencies
 */
import clsx from 'clsx';

/**
 * WordPress dependencies
 */
import {
	getColorClassName,
	useBlockProps,
	__experimentalGetColorClassesAndStyles as getColorClassesAndStyles,
} from '@wordpress/block-editor';

export default function separatorSave( { attributes } ) {
	const { backgroundColor, style, opacity, tagName: Tag } = attributes;
	const customColor = style?.color?.background;
	const colorProps = getColorClassesAndStyles( attributes );
	// The hr support changing color using border-color, since border-color
	// is not yet supported in the color palette, we use background-color.

	// The dots styles uses text for the dots, to change those dots color is
	// using color, not backgroundColor.
	const colorClass = getColorClassName( 'color', backgroundColor );

	const className = clsx(
		{
			'has-text-color': backgroundColor || customColor,
			[ colorClass ]: colorClass,
			'has-css-opacity': opacity === 'css',
			'has-alpha-channel-opacity': opacity === 'alpha-channel',
		},
		colorProps.className
	);

	const styles = {
		backgroundColor: colorProps?.style?.backgroundColor,
		color: colorClass ? undefined : customColor,
	};
	return <Tag { ...useBlockProps.save( { className, style: styles } ) } />;
}
