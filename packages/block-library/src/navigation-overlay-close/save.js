/**
 * External dependencies
 */
import clsx from 'clsx';

/**
 * WordPress dependencies
 */
import {
	useBlockProps,
	RichText,
	__experimentalGetColorClassesAndStyles as getColorClassesAndStyles,
	__experimentalGetSpacingClassesAndStyles as getSpacingClassesAndStyles,
	getTypographyClassesAndStyles,
} from '@wordpress/block-editor';
import { __ } from '@wordpress/i18n';

export default function navigationOverlayCloseSave( { attributes } ) {
	const { displayMode, text } = attributes;
	const colorProps = getColorClassesAndStyles( attributes );
	const spacingProps = getSpacingClassesAndStyles( attributes );
	const typographyProps = getTypographyClassesAndStyles( attributes );

	const showIcon = displayMode === 'icon' || displayMode === 'both';
	const showText = displayMode === 'text' || displayMode === 'both';

	return (
		<button
			{ ...useBlockProps.save( {
				className: clsx(
					'wp-block-navigation-overlay-close',
					colorProps.className,
					spacingProps.className,
					typographyProps.className
				),
				style: {
					...colorProps.style,
					...spacingProps.style,
					...typographyProps.style,
				},
				type: 'button',
				'aria-label': __( 'Close' ),
			} ) }
		>
			{ showIcon && (
				<svg
					xmlns="http://www.w3.org/2000/svg"
					viewBox="0 0 24 24"
					width="24"
					height="24"
					aria-hidden="true"
					focusable="false"
				>
					<path d="M13 11.8l6.1-6.3-1.1-1-6.1 6.2-6.1-6.2-1.1 1 6.1 6.3-6.5 6.7 1.1 1 6.5-6.6 6.5 6.6 1.1-1z" />
				</svg>
			) }
			{ showText && (
				<RichText.Content
					tagName="span"
					value={ text }
					className="wp-block-navigation-overlay-close__text"
				/>
			) }
		</button>
	);
}
