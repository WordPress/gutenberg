/**
 * External dependencies
 */
import clsx from 'clsx';

/**
 * WordPress dependencies
 */
import {
	useBlockProps,
	__experimentalGetColorClassesAndStyles as getColorClassesAndStyles,
} from '@wordpress/block-editor';

export default function overlayCloseSave( { attributes } ) {
	const { displayMode, text } = attributes;
	const colorProps = getColorClassesAndStyles( attributes );

	const showIcon = displayMode === 'icon' || displayMode === 'both';
	const showText = displayMode === 'text' || displayMode === 'both';

	return (
		<button
			{ ...useBlockProps.save( {
				className: clsx(
					'wp-block-overlay-close',
					colorProps.className
				),
				style: colorProps.style,
				type: 'button',
				'aria-label': 'Close',
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
			{ showText && <span>{ text }</span> }
		</button>
	);
}
