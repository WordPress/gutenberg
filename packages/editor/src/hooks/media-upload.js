/**
 * WordPress dependencies
 */
import { addFilter } from '@wordpress/hooks';
import { MediaUpload } from '@wordpress/media-utils';

addFilter(
	'editor.MediaUpload',
	'core/editor/components/media-upload',
	() => MediaUpload
);
