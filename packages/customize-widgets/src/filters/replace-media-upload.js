/**
 * WordPress dependencies
 */
import { addFilter } from '@wordpress/hooks';
import {
	MediaUpload,
	privateApis as mediaUtilsPrivateApis,
} from '@wordpress/media-utils';

/**
 * Internal dependencies
 */
import { unlock } from '../lock-unlock';

const { MediaUploadModal: MediaUploadModalComponent } = unlock(
	mediaUtilsPrivateApis
);

if ( window.__experimentalDataViewsMediaModal ) {
	// Create a new filter for the MediaUploadModal component
	addFilter(
		'editor.MediaUploadModal',
		'core/customize-widgets/replace-media-upload-modal',
		() => {
			return MediaUploadModalComponent;
		}
	);
}

const replaceMediaUpload = () => MediaUpload;

addFilter(
	'editor.MediaUpload',
	'core/edit-widgets/replace-media-upload',
	replaceMediaUpload
);
