import { Button } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import MediaUpload from '../../media-upload';
import MediaUploadCheck from '../../media-upload/check';

// The attach flow is image-only, so the picker is constrained to images.
const ATTACH_ALLOWED_TYPES = [ 'image' ];

/**
 * Opens the Media Library to attach images to the current post. Only rendered
 * for media categories that expose an `attach` capability (i.e. the "Attached
 * images" source); other sources render the panel exactly as before.
 *
 * The picker opens fresh each time with no pre-selected value, so it is purely
 * additive: selecting images attaches them, and it does not imply that
 * deselecting would detach. Detaching is a separate, explicit per-item action.
 */
export default function AttachImagesButton( {
	onSelect,
}: {
	/**
	 * Called with the selected media items.
	 */
	onSelect: ( media: unknown ) => void;
} ) {
	return (
		<MediaUploadCheck>
			<MediaUpload
				multiple="add"
				onSelect={ onSelect }
				allowedTypes={ ATTACH_ALLOWED_TYPES }
				title={ __( 'Attach images' ) }
				render={ ( { open }: { open: () => void } ) => (
					<Button
						__next40pxDefaultSize
						className="block-editor-inserter__media-panel-attach"
						data-unstable-ignore-focus-outside-for-relatedtarget=".media-modal"
						onClick={ (
							event: React.MouseEvent< HTMLElement >
						) => {
							( event.target as HTMLElement ).focus();
							open();
						} }
						variant="secondary"
					>
						{ __( 'Attach images' ) }
					</Button>
				) }
			/>
		</MediaUploadCheck>
	);
}
