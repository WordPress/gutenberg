/**
 * WordPress dependencies
 */
import { useMemo } from '@wordpress/element';

/**
 * React hook used to compute the media upload settings to use in the post editor.
 *
 * @param {Object} settings Media upload settings prop.
 *
 * @return {Object} Media upload settings.
 */
function useMediaUploadSettings( settings = {} ) {
	return useMemo(
		() => ( {
			mediaUpload: settings.mediaUpload,
			mediaSideload: settings.mediaSideload,
			maxUploadFileSize: settings.maxUploadFileSize,
			allowedMimeTypes: settings.allowedMimeTypes,
		} ),
		[ settings ]
	);
}

export default useMediaUploadSettings;
