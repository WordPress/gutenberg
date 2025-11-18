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

export default function OverlayCloseSave( { attributes, className } ) {
	const colorProps = getColorClassesAndStyles( attributes );

	return (
		<div
			{ ...useBlockProps.save( {
				className: clsx( className, 'wp-block-overlay-close' ),
			} ) }
		>
			<button
				type="button"
				className={ clsx(
					'wp-block-overlay-close__button',
					colorProps.className
				) }
				style={ colorProps.style }
				aria-label="Close overlay"
			>
				<span className="wp-block-overlay-close__icon">×</span>
				<span className="wp-block-overlay-close__text">Close</span>
			</button>
		</div>
	);
}
