/**
 * External dependencies
 */
import clsx from 'clsx';
/**
 * WordPress dependencies
 */
import {
	useBlockProps,
	__experimentalGetBorderClassesAndStyles as getBorderClassesAndStyles,
	__experimentalGetColorClassesAndStyles as getColorClassesAndStyles,
	__experimentalGetSpacingClassesAndStyles as getSpacingClassesAndStyles,
	__experimentalGetShadowClassesAndStyles as getShadowClassesAndStyles,
	RichText,
} from '@wordpress/block-editor';
/**
 * Internal dependencies
 */
import {
	caret,
	chevron,
	chevronRight,
	circlePlus,
	plus,
} from '../accordion-item/icons';

const ICONS = {
	plus,
	circlePlus,
	chevron,
	chevronRight,
	caret,
};

export default function save( { attributes } ) {
	const { level, title, iconPosition, textAlign, icon } = attributes;
	const TagName = 'h' + level;

	const blockProps = useBlockProps.save();
	const borderProps = getBorderClassesAndStyles( attributes );
	const colorProps = getColorClassesAndStyles( attributes );
	const spacingProps = getSpacingClassesAndStyles( attributes );
	const shadowProps = getShadowClassesAndStyles( attributes );

	const Icon = ICONS[ icon ];

	return (
		<TagName
			{ ...blockProps }
			className={ clsx(
				blockProps.className,
				colorProps.className,
				borderProps.className,
				'accordion-item__heading',
				{
					[ `has-custom-font-size` ]: blockProps?.style?.fontSize,
					[ `icon-position-left` ]: iconPosition === 'left',
					[ `has-text-align-${ textAlign }` ]: textAlign,
				}
			) }
			style={ {
				...borderProps.style,
				...colorProps.style,
				...shadowProps.style,
			} }
		>
			<button
				className={ clsx( 'accordion-item__toggle' ) }
				style={ {
					...spacingProps.style,
				} }
			>
				<RichText.Content tagName="span" value={ title } />
				<span
					className={ clsx( `accordion-item__toggle-icon`, {
						[ `has-icon-${ icon }` ]: icon,
					} ) }
					style={ {
						// TO-DO: make this configurable
						width: `1.2em`,
						height: `1.2em`,
					} }
				>
					{ icon && <Icon width="1.2em" height="1.2em" /> }
				</span>
			</button>
		</TagName>
	);
}
