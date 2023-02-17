/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import {
	getColorClassName,
	useBlockProps,
	__experimentalGetColorClassesAndStyles as getColorClassesAndStyles,
} from '@wordpress/block-editor';

export default function separatorSave( { attributes } ) {
	const { backgroundColor, style, opacity } = attributes;
	const customColor = style?.color?.background;
	const colorProps = getColorClassesAndStyles( attributes );
	// The hr support changing color using border-color, since border-color
	// is not yet supported in the color palette, we use background-color.

	// The dots styles uses text for the dots, to change those dots color is
	// using color, not backgroundColor.
	const colorClass = getColorClassName( 'color', backgroundColor );

	const className = classnames(
		{
			'has-text-color': backgroundColor || customColor,
			[ colorClass ]: colorClass,
			'has-css-opacity': opacity === 'css',
			'has-alpha-channel-opacity': opacity === 'alpha-channel',
			'is-style-default':
				( ! attributes.hasOwnProperty( 'className' ) ||
					attributes.className === 'is-style-default' ) &&
				'is-style-default',
			'is-style-wide': attributes.className === 'is-style-wide',
			'is-style-dots': attributes.className === 'is-style-dots',
		},
		colorProps.className
	);

	const styles = {
		backgroundColor: colorProps?.style?.backgroundColor,
		color: colorClass ? undefined : customColor,
	};
	return <hr { ...useBlockProps.save( { className, style: styles } ) } />;
}
