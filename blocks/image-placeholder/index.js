/**
 * WordPress dependencies
 */
import { DropZone, FormFileUpload, Placeholder } from '@wordpress/components';
import { mediaUpload } from '@wordpress/utils';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import MediaUploadButton from '../media-upload-button';

export default function ImagePlaceHolder( { className, setAttributes, icon, label, onSelectImage } ) {
	const dropFiles = ( files ) => mediaUpload( files, setAttributes );
	const uploadFromFiles = ( event ) => mediaUpload( event.target.files, setAttributes );
	return (
		<Placeholder
			className={ className }
			instructions={ __( 'Drag image here or add from media library' ) }
			icon={ icon }
			label={ label } >
			<DropZone
				onFilesDrop={ dropFiles }
			/>
			<FormFileUpload
				isLarge
				className="wp-block-image__upload-button"
				onChange={ uploadFromFiles }
				accept="image/*"
			>
				{ __( 'Upload' ) }
			</FormFileUpload>
			<MediaUploadButton
				buttonProps={ { isLarge: true } }
				onSelect={ onSelectImage }
				type="image"
			>
				{ __( 'Add from Media Library' ) }
			</MediaUploadButton>
		</Placeholder>
	);
}
