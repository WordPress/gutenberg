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
	getTypographyClassesAndStyles,
} from '@wordpress/block-editor';

export default function Save( { attributes } ) {
	const borderProps = getBorderClassesAndStyles( attributes );
	const colorProps = getColorClassesAndStyles( attributes );
	const spacingProps = getSpacingClassesAndStyles( attributes );
	const typographyProps = getTypographyClassesAndStyles( attributes );

	const blockProps = useBlockProps.save( {
		className: clsx(
			'tabs__list',
			colorProps.className,
			borderProps.className,
			typographyProps.className
		),
		style: {
			...colorProps.style,
			...borderProps.style,
			...spacingProps.style,
			...typographyProps.style,
		},
		role: 'tablist',
	} );

	// Return empty tablist - will be populated by PHP render callback
	return <div { ...blockProps }></div>;
}
