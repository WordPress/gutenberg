/**
 * WordPress dependencies
 */
import { addFilter } from '@wordpress/hooks';
import { MediaUpload } from '@wordpress/media-utils';

addFilter(
	'editor.MediaUpload',
	'core/edit-site/components/media-upload',
	() => MediaUpload
);
