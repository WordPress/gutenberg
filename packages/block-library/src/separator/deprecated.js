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

// Deprecation for blocks saved before isDecorative attribute was added
const v2 = {
	attributes: {
		opacity: {
			type: 'string',
			default: 'alpha-channel',
		},
		tagName: {
			type: 'string',
			enum: [ 'hr', 'div' ],
			default: 'hr',
		},
		backgroundColor: {
			type: 'string',
		},
		style: {
			type: 'object',
		},
	},
	save( { attributes } ) {
		const { backgroundColor, style, opacity, tagName: Tag } = attributes;
		const customColor = style?.color?.background;
		const colorProps = getColorClassesAndStyles( attributes );

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
		return (
			<Tag { ...useBlockProps.save( { className, style: styles } ) } />
		);
	},
	migrate( attributes ) {
		return {
			...attributes,
			// Default to decorative for existing blocks
			isDecorative: true,
		};
	},
};

const v1 = {
	attributes: {
		color: {
			type: 'string',
		},
		customColor: {
			type: 'string',
		},
	},
	save( { attributes } ) {
		const { color, customColor } = attributes;
		// the hr support changing color using border-color, since border-color
		// is not yet supported in the color palette, we use background-color
		const backgroundClass = getColorClassName( 'background-color', color );
		// the dots styles uses text for the dots, to change those dots color is
		// using color, not backgroundColor
		const colorClass = getColorClassName( 'color', color );
		const className = clsx( {
			'has-text-color has-background': color || customColor,
			[ backgroundClass ]: backgroundClass,
			[ colorClass ]: colorClass,
		} );
		const style = {
			backgroundColor: backgroundClass ? undefined : customColor,
			color: colorClass ? undefined : customColor,
		};
		return <hr { ...useBlockProps.save( { className, style } ) } />;
	},
	migrate( attributes ) {
		const { color, customColor, ...restAttributes } = attributes;
		return {
			...restAttributes,
			backgroundColor: color ? color : undefined,
			opacity: 'css',
			style: customColor
				? { color: { background: customColor } }
				: undefined,
			tagName: 'hr',
			isDecorative: true,
		};
	},
};
export default [ v2, v1 ];
