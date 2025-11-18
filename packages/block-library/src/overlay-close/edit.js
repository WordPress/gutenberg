/**
 * External dependencies
 */
import clsx from 'clsx';

/**
 * WordPress dependencies
 */
import {
	useBlockProps,
	__experimentalUseColorProps as useColorProps,
} from '@wordpress/block-editor';
import { Button } from '@wordpress/components';
import { close } from '@wordpress/icons';
import { __ } from '@wordpress/i18n';

export default function OverlayCloseEdit( { attributes } ) {
	const colorProps = useColorProps( attributes );
	const blockProps = useBlockProps( {
		className: 'wp-block-overlay-close',
		style: {
			...colorProps.style,
		},
	} );

	return (
		<div { ...blockProps }>
			<Button
				__next40pxDefaultSize
				icon={ close }
				label={ __( 'Close overlay' ) }
				className={ clsx(
					'wp-block-overlay-close__button',
					colorProps.className
				) }
				style={ colorProps.style }
			>
				{ __( 'Close' ) }
			</Button>
		</div>
	);
}
