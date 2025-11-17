/**
 * WordPress dependencies
 */
import { useBlockProps } from '@wordpress/block-editor';
import { Button } from '@wordpress/components';
import { close } from '@wordpress/icons';
import { __ } from '@wordpress/i18n';

export default function OverlayCloseEdit( { attributes, setAttributes } ) {
	const blockProps = useBlockProps( {
		className: 'wp-block-overlay-close',
	} );

	return (
		<div { ...blockProps }>
			<Button
				icon={ close }
				label={ __( 'Close overlay' ) }
				className="wp-block-overlay-close__button"
			>
				{ __( 'Close' ) }
			</Button>
		</div>
	);
}
