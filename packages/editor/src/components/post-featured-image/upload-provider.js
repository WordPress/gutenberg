/**
 * WordPress dependencies
 */
import { FormFileUpload } from '@wordpress/components';
import { MediaUpload, MediaUploadCheck } from '@wordpress/block-editor';

export default function PostFeaturedImageUploadProvider( {
	fallback,
	title,
	selectedId,
	allowedMediaTypes,
	allowedUploadTypes,
	onSelect,
	onUpload,
	children,
} ) {
	return (
		<MediaUploadCheck fallback={ fallback }>
			<MediaUpload
				title={ title }
				onSelect={ onSelect }
				unstableFeaturedImageFlow
				allowedTypes={ allowedMediaTypes }
				modalClass="editor-post-featured-image__media-modal"
				value={ selectedId }
				render={ ( { open: openMediaLibrary } ) => (
					<FormFileUpload
						onChange={ ( event ) => onUpload( event.target.files ) }
						accept={ allowedUploadTypes }
						render={ ( { openFileDialog } ) =>
							children( { openMediaLibrary, openFileDialog } )
						}
					/>
				) }
			/>
		</MediaUploadCheck>
	);
}
