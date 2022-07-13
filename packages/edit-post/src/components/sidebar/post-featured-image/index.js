/**
 * WordPress dependencies
 */
import {
	PostFeaturedImageCheck,
	PostFeaturedImage as PostFeaturedImageForm,
} from '@wordpress/editor';
import { MediaUploadCheck } from '@wordpress/block-editor';

export default function PostFeaturedImage() {
	return (
		<PostFeaturedImageCheck>
			<MediaUploadCheck>
				<PostFeaturedImageForm className="edit-post-post-featured-image" />
			</MediaUploadCheck>
		</PostFeaturedImageCheck>
	);
}
