/**
 * WordPress dependencies
 */
import { addFilter } from '@wordpress/hooks';
import { privateApis } from '@wordpress/media-utils';

/**
 * Internal dependencies
 */
import { unlock } from '../lock-unlock';

const { MediaUploadModal } = unlock( privateApis );

addFilter(
	'editor.MediaUpload',
	'core/editor/components/media-upload',
	() => MediaUploadModal
);
