/**
 * WordPress dependencies
 */
import { Button } from '@wordpress/components';
import { close } from '@wordpress/icons';
import { __ } from '@wordpress/i18n';

export default function OverlayToggleControl( { onClose } ) {
	return (
		<div
			className="wp-block-navigation__overlay-toggle-control"
			style={ {
				position: 'fixed',
				top: '10px',
				right: '10px',
				zIndex: 100000,
			} }
		>
			<Button
				__next40pxDefaultSize
				icon={ close }
				onClick={ onClose }
				aria-label={ __( 'Close overlay' ) }
				variant="primary"
			>
				{ __( 'Close Overlay' ) }
			</Button>
		</div>
	);
}

