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
	__experimentalGetSpacingClassesAndStyles as getSpacingClassesAndStyles,
	__experimentalGetShadowClassesAndStyles as getShadowClassesAndStyles,
	getTypographyClassesAndStyles,
} from '@wordpress/block-editor';

export default function Save( { attributes } ) {
	const borderProps = getBorderClassesAndStyles( attributes );
	const shadowProps = getShadowClassesAndStyles( attributes );
	const spacingProps = getSpacingClassesAndStyles( attributes );
	const typographyProps = getTypographyClassesAndStyles( attributes );

	// Container props - simple, no color classes (handled via CSS custom properties)
	const blockProps = useBlockProps.save( {
		className: 'tabs__list',
		role: 'tablist',
	} );

	// Template element with all serialized styles for individual tabs
	// PHP will extract this template and clone it for each tab
	const tabTemplateProps = {
		className: clsx(
			'tabs__tab-label',
			'tabs__tab-template', // Marker class for PHP extraction
			borderProps.className,
			typographyProps.className,
			shadowProps.className,
		),
		style: {
			...borderProps.style,
			...shadowProps.style,
			...spacingProps.style,
			...typographyProps.style,
		},
		// Hidden by default, will be removed by PHP
		hidden: true,
	};

	return (
		<div { ...blockProps }>
			{ /* eslint-disable-next-line jsx-a11y/anchor-has-content, jsx-a11y/anchor-is-valid */ }
			<a { ...tabTemplateProps } />
		</div>
	);
}
