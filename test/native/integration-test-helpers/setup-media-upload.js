/**
 * External dependencies
 */
import { act } from '@testing-library/react-native';

/**
 * WordPress dependencies
 */
import { subscribeMediaUpload } from '@wordpress/react-native-bridge';
import {
	MEDIA_UPLOAD_STATE_UPLOADING,
	MEDIA_UPLOAD_STATE_SUCCEEDED,
	MEDIA_UPLOAD_STATE_FAILED,
	MEDIA_UPLOAD_STATE_RESET,
} from '@wordpress/block-editor';

/**
 * Sets up the media upload mock functions for testing.
 *
 * @typedef {Object} MediaUploadMockFunctions
 * @property {Function} notifyUploadingState Notify uploading state for a media item.
 * @property {Function} notifySucceedState   Notify succeed state for a media item.
 * @property {Function} notifyFailedState    Notify failed state for a media item.
 * @property {Function} notifyResetState     Notify reset state for a media item.
 *
 * @return {MediaUploadMockFunctions} Notify state functions.
 */
export const setupMediaUpload = () => {
	const mediaUploadListeners = [];
	subscribeMediaUpload.mockImplementation( ( callback ) => {
		mediaUploadListeners.push( callback );
		return { remove: jest.fn() };
	} );
	const notifyMediaUpload = ( payload ) =>
		mediaUploadListeners.forEach( ( listener ) => listener( payload ) );

	return {
		notifyUploadingState: async ( mediaItem ) =>
			act( async () => {
				notifyMediaUpload( {
					state: MEDIA_UPLOAD_STATE_UPLOADING,
					mediaId: mediaItem.localId,
					progress: 0.25,
				} );
			} ),
		notifySucceedState: async ( mediaItem ) =>
			act( async () => {
				notifyMediaUpload( {
					state: MEDIA_UPLOAD_STATE_SUCCEEDED,
					mediaId: mediaItem.localId,
					mediaUrl: mediaItem.serverUrl,
					mediaServerId: mediaItem.serverId,
					metadata: mediaItem.metadata,
				} );
			} ),
		notifyFailedState: async ( mediaItem ) =>
			act( async () => {
				notifyMediaUpload( {
					state: MEDIA_UPLOAD_STATE_FAILED,
					mediaId: mediaItem.localId,
					progress: 0.5,
				} );
			} ),
		notifyResetState: async ( mediaItem ) =>
			act( async () => {
				notifyMediaUpload( {
					state: MEDIA_UPLOAD_STATE_RESET,
					mediaId: mediaItem.localId,
					progress: 0,
				} );
			} ),
	};
};
