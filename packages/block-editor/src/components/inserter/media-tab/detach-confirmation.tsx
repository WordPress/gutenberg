import { Button } from '@wordpress/components';
import { __, sprintf } from '@wordpress/i18n';

/**
 * The body of the "Detach" action's confirmation modal.
 */
export default function DetachConfirmation( {
	postTypeLabel,
	onCancel,
	onConfirm,
}: {
	/**
	 * Name of the post type, e.g. "Page".
	 */
	postTypeLabel?: string;
	onCancel: () => void;
	onConfirm: () => void;
} ) {
	return (
		<>
			<p>
				{ postTypeLabel
					? sprintf(
							/* translators: %s: Name of the post type e.g: "Page". */
							__(
								'Detach this image from the current %s? The image will remain in the Media Library.'
							),
							postTypeLabel
						)
					: __(
							'Detach this image from the current post? The image will remain in the Media Library.'
						) }
			</p>
			<div className="block-editor-inserter__media-panel-detach-actions">
				<Button
					__next40pxDefaultSize
					variant="tertiary"
					onClick={ onCancel }
				>
					{ __( 'Cancel' ) }
				</Button>
				<Button
					__next40pxDefaultSize
					variant="primary"
					onClick={ onConfirm }
				>
					{ __( 'Detach' ) }
				</Button>
			</div>
		</>
	);
}
