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

/**
 *  ImagePlaceHolder is a react component used by blocks containing user configurable images e.g: image and cover image.
 *
 * @param   {Object} props  React props passed to the component.
 *
 * @returns {Object} Rendered placeholder.
 */
export default function ImagePlaceHolder( { className, icon, label, onSelectImage } ) {
	const setImage = ( [ image ] ) => onSelectImage( image );
	const dropFiles = ( files ) => mediaUpload( files, setImage );
	const uploadFromFiles = ( event ) => mediaUpload( event.target.files, setImage );
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
