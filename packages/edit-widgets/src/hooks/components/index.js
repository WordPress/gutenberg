/**
 * WordPress dependencies
 */
import { addFilter } from '@wordpress/hooks';
import { MediaUpload } from '@wordpress/media-utils';

const replaceMediaUpload = () => MediaUpload;

addFilter(
	'editor.MediaUpload',
	'core/edit-widgets/replace-media-upload',
	replaceMediaUpload
);
