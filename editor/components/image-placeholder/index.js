/**
 * External dependencies
 */
import { map } from 'lodash';

/**
 * WordPress dependencies
 */
import { DropZone, FormFileUpload, Placeholder, Button } from '@wordpress/components';
import { PostTypeSupportCheck } from '@wordpress/editor';
import { __ } from '@wordpress/i18n';
import { editorMediaUpload, rawHandler } from '@wordpress/blocks';

/**
 * Internal dependencies
 */
import MediaUpload from '../media-upload';

/**
 *  ImagePlaceholder is a react component used by blocks containing user configurable images e.g: image and cover image.
 *
 * @param   {Object} props  React props passed to the component.
 *
 * @return {Object} Rendered placeholder.
 */
export default function ImagePlaceholder( { className, icon, label, onSelectImage, multiple = false } ) {
	const setImage = multiple ? onSelectImage : ( [ image ] ) => onSelectImage( image );
	const onFilesDrop = ( files ) => editorMediaUpload( files, setImage, 'image' );
	const onHTMLDrop = ( HTML ) => setImage( map(
		rawHandler( { HTML, mode: 'BLOCKS' } )
			.filter( ( { name } ) => name === 'core/image' ),
		'attributes'
	) );
	const uploadFromFiles = ( event ) => editorMediaUpload( event.target.files, setImage, 'image' );
	return (
		<Placeholder
			className={ className }
			instructions={ multiple ?
				__( 'Drag images here or add from media library' ) :
				__( 'Drag image here or add from media library' ) }
			icon={ icon }
			label={ label } >
			<DropZone
				onFilesDrop={ onFilesDrop }
				onHTMLDrop={ onHTMLDrop }
			/>
			<FormFileUpload
				multiple={ multiple }
				isLarge
				className="wp-block-image__upload-button"
				onChange={ uploadFromFiles }
				accept="image/*"
			>
				{ __( 'Upload' ) }
			</FormFileUpload>
			<PostTypeSupportCheck supportKeys="media-library">
				<MediaUpload
					gallery={ multiple }
					multiple={ multiple }
					onSelect={ onSelectImage }
					type="image"
					render={ ( { open } ) => (
						<Button isLarge onClick={ open }>
							{ __( 'Media Library' ) }
						</Button>
					) }
				/>
			</PostTypeSupportCheck>
		</Placeholder>
	);
}
