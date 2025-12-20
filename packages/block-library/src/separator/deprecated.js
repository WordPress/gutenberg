/**
 * External dependencies
 */
import clsx from 'clsx';

/**
 * WordPress dependencies
 */
import { getColorClassName, useBlockProps } from '@wordpress/block-editor';

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
		};
	},
};

export default [ v1 ];
