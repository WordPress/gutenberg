/**
 * WordPress dependencies
 */
import { addFilter } from '@wordpress/hooks';

/**
 * Internal dependencies
 */
import MediaUpload from './media-upload';

const replaceMediaUpload = () => MediaUpload;

addFilter(
	'blocks.MediaUpload',
	'core/edit-post/blocks/media-upload/replaceMediaUpload',
	replaceMediaUpload
);
