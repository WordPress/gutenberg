/**
 * WordPress dependencies
 */
import {
	InnerBlocks,
	useBlockProps,
	__experimentalGetBorderClassesAndStyles as getBorderClassesAndStyles,
	__experimentalGetColorClassesAndStyles as getColorClassesAndStyles,
	__experimentalGetSpacingClassesAndStyles as getSpacingClassesAndStyles,
	__experimentalGetShadowClassesAndStyles as getShadowClassesAndStyles,
} from '@wordpress/block-editor';
/**
 * External dependencies
 */
import clsx from 'clsx';

export default function save( { attributes } ) {
	const blockProps = useBlockProps.save();
	const borderProps = getBorderClassesAndStyles( attributes );
	const colorProps = getColorClassesAndStyles( attributes );
	const spacingProps = getSpacingClassesAndStyles( attributes );
	const shadowProps = getShadowClassesAndStyles( attributes );

	return (
		<div
			{ ...blockProps }
			className={ clsx(
				blockProps.className,
				colorProps.className,
				borderProps.className,
				{
					[ `has-custom-font-size` ]: blockProps?.style?.fontSize,
				}
			) }
			style={ {
				...borderProps.style,
				...colorProps.style,
				...shadowProps.style,
			} }
		>
			<div
				className="accordion-content__wrapper"
				style={ {
					...spacingProps.style,
				} }
			>
				<InnerBlocks.Content />
			</div>
		</div>
	);
}
