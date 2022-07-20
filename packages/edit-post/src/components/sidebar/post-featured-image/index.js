/**
 * WordPress dependencies
 */
import {
	PostFeaturedImageCheck,
	PostFeaturedImage as PostFeaturedImageForm,
} from '@wordpress/editor';
import { MediaUploadCheck } from '@wordpress/block-editor';
import { __experimentalToolsPanelItem as ToolsPanelItem } from '@wordpress/components';
import { __ } from '@wordpress/i18n';

export default function PostFeaturedImage() {
	return (
		<PostFeaturedImageCheck>
			<MediaUploadCheck>
				<ToolsPanelItem
					className="edit-post-post-featured-image"
					label={ __( 'Featured image' ) }
					hasValue={ () => true }
				>
					<PostFeaturedImageForm />
				</ToolsPanelItem>
			</MediaUploadCheck>
		</PostFeaturedImageCheck>
	);
}
