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
		'core/editor/components/media-upload-modal',
		() => {
			return MediaUploadModalComponent;
		}
	);
}
addFilter( 'editor.MediaUpload', 'core/editor/components/media-upload', () => {
	return MediaUpload;
} );
