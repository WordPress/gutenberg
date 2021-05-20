/**
 * External dependencies
 */
import { NativeModules, NativeEventEmitter, Platform } from 'react-native';

const { RNReactNativeGutenbergBridge } = NativeModules;
const isIOS = Platform.OS === 'ios';
const isAndroid = Platform.OS === 'android';

const gutenbergBridgeEvents = new NativeEventEmitter(
	RNReactNativeGutenbergBridge
);

export const { isInitialColorSchemeDark } = RNReactNativeGutenbergBridge;

export const mediaSources = {
	deviceLibrary: 'DEVICE_MEDIA_LIBRARY',
	deviceCamera: 'DEVICE_CAMERA',
	siteMediaLibrary: 'SITE_MEDIA_LIBRARY',
};

export const actionButtons = {
	missingBlockAlertActionButton: 'missing_block_alert_action_button',
};

// Console polyfill from react-native

export function nativeLoggingHook( message, logLevel ) {
	RNReactNativeGutenbergBridge.editorDidEmitLog( message, logLevel );
}

// Send messages

export function sendNativeEditorDidLayout() {
	// For now, this is only needed on iOS to solve layout issues with the toolbar.
	// If this become necessary on Android in the future, we can try to build a registration API from Native
	// to register messages it wants to receive, similar to the Native -> JS messages listener system.
	if ( isIOS ) {
		RNReactNativeGutenbergBridge.editorDidLayout();
	}
}

// Register listeners

export function subscribeParentGetHtml( callback ) {
	return gutenbergBridgeEvents.addListener( 'requestGetHtml', callback );
}

export function subscribeParentToggleHTMLMode( callback ) {
	return gutenbergBridgeEvents.addListener( 'toggleHTMLMode', callback );
}

export function subscribeSetFocusOnTitle( callback ) {
	return gutenbergBridgeEvents.addListener( 'setFocusOnTitle', callback );
}

export function subscribeSetTitle( callback ) {
	return gutenbergBridgeEvents.addListener( 'setTitle', callback );
}

export function subscribeUpdateHtml( callback ) {
	return gutenbergBridgeEvents.addListener( 'updateHtml', callback );
}

export function subscribeFeaturedImageIdNativeUpdated( callback ) {
	return isAndroid
		? gutenbergBridgeEvents.addListener(
				'featuredImageIdNativeUpdated',
				callback
		  )
		: undefined;
}

/**
 * Request to subscribe to mediaUpload events
 *
 * When a media item exists as a local file and is to be uploaded, these are the generated events that are useful listening to.
 * see subscribeMediaSave for events during a save operation.
 *
 * @param {Function}       callback  RN Callback function to be called with the following
 * 										state and params:
 * 	state:
 * 		MEDIA_UPLOAD_STATE_SAVING: this is a progress update. Takes String mediaId, float progress.
 * 		MEDIA_UPLOAD_STATE_SUCCEEDED: sent when one media is finished being saved. Takes String mediaId, String mediaUrl, String serverID
 * 									(which is the remote id assigned to this file after having been uploaded).
 * 		MEDIA_UPLOAD_STATE_FAILED: sent in case of saving failure (final state). Takes String mediaId.
 * 		MEDIA_UPLOAD_STATE_RESET: sent when the progress and state needs be reset (a retry for example, for cleanup). Takes String mediaId.
 */
export function subscribeMediaUpload( callback ) {
	return gutenbergBridgeEvents.addListener( 'mediaUpload', callback );
}

/**
 * Request to subscribe to mediaSave events
 *
 * When a media item does not yet exist as a local file and is progressively being saved, these are the generated events that are useful listening to.
 * see subscribeMediaUpload for events during an upload operation.
 *
 * @param {Function}       callback  RN Callback function to be called with the following
 * 										state and params:
 *  Note that the first 4 states described are similar to upload events.
 * 	state:
 * 		MEDIA_SAVE_STATE_SAVING: this is a progress update. Takes String mediaId, float progress.
 * 		MEDIA_SAVE_STATE_SUCCEEDED: sent when one media is finished being saved. Takes String mediaId, String mediaUrl.
 * 		MEDIA_SAVE_STATE_FAILED: sent in case of saving failure (final state). Takes String mediaId.
 * 		MEDIA_SAVE_STATE_RESET: sent when the progress and state needs be reset (a retry for example, for cleanup). Takes String mediaId.
 * 		MEDIA_SAVE_FINAL_STATE_RESULT: used in media collections, sent when ALL media items in a collection have reached
 * 									a final state (either FAILED or SUCCEEDED). Handy to know when to show a final state to the user, on
 * 									a media collection based block when we don't know if there are still events to be received for other
 * 									items in the collection.
 * 		MEDIA_SAVE_MEDIAID_CHANGED:	used when changing a media item id from a temporary id to a local file id, and then from a local file
 * 									id to a remote file id.
 */
export function subscribeMediaSave( callback ) {
	return gutenbergBridgeEvents.addListener( 'mediaSave', callback );
}

export function subscribeMediaAppend( callback ) {
	return gutenbergBridgeEvents.addListener( 'mediaAppend', callback );
}

export function subscribeAndroidModalClosed( callback ) {
	return isAndroid
		? gutenbergBridgeEvents.addListener( 'notifyModalClosed', callback )
		: undefined;
}

export function subscribeUpdateTheme( callback ) {
	return gutenbergBridgeEvents.addListener( 'updateTheme', callback );
}

export function subscribePreferredColorScheme( callback ) {
	return gutenbergBridgeEvents.addListener(
		'preferredColorScheme',
		callback
	);
}

export function subscribeUpdateCapabilities( callback ) {
	return gutenbergBridgeEvents.addListener( 'updateCapabilities', callback );
}

export function subscribeShowNotice( callback ) {
	return gutenbergBridgeEvents.addListener( 'showNotice', callback );
}

/**
 * @callback FnReplaceBlockCompletion
 * @param {string} html the HTML to replace the block.
 * @param {string} clientId the clientId of the block to be replaced.
 */

/**
 * Subscribe a listener to replace a single block.
 *
 * @param {FnReplaceBlockCompletion} callback the completion callback.
 */
export function subscribeReplaceBlock( callback ) {
	return gutenbergBridgeEvents.addListener( 'replaceBlock', callback );
}

/**
 * Request media picker for the given media source.
 *
 * Kinds of media source can be device library, camera, etc.
 *
 * @param {string}         source    The media source to request media from.
 * @param {Array<string>}  filter    Array of media types to filter the media to select.
 * @param {boolean}        multiple  Is multiple selection allowed?
 * @param {Function}       callback  RN Callback function to be called with the selected media objects.
 */
export function requestMediaPicker( source, filter, multiple, callback ) {
	RNReactNativeGutenbergBridge.requestMediaPickFrom(
		source,
		filter,
		multiple,
		callback
	);
}

/**
 * Request to render an unsuported block.
 *
 * A way to show unsupported blocks to the user is to render it on a web view.
 *
 * @param {string} htmlContent Raw html content of the block.
 * @param {string} blockClientId the clientId of the block.
 * @param {string} blockName the internal system block name.
 * @param {string} blockTitle the user-facing, localized block name.
 */
export function requestUnsupportedBlockFallback(
	htmlContent,
	blockClientId,
	blockName,
	blockTitle
) {
	RNReactNativeGutenbergBridge.requestUnsupportedBlockFallback(
		htmlContent,
		blockClientId,
		blockName,
		blockTitle
	);
}

export function sendActionButtonPressedAction( buttonType ) {
	RNReactNativeGutenbergBridge.actionButtonPressed( buttonType );
}

export function requestMediaImport( url, callback ) {
	return RNReactNativeGutenbergBridge.requestMediaImport( url, callback );
}

/**
 * Request to start listening to upload events when in-progress uploads are in place
 *
 * For example, when media is being uploaded and the user re-enters the editor
 *
 */
export function mediaUploadSync() {
	return RNReactNativeGutenbergBridge.mediaUploadSync();
}

/**
 * Request to start listening to save events when in-progress saves are in place
 *
 * For example, when media is being saved and the user re-enters the editor
 *
 */
export function mediaSaveSync() {
	return RNReactNativeGutenbergBridge.mediaSaveSync();
}

export function requestImageFailedRetryDialog( mediaId ) {
	return RNReactNativeGutenbergBridge.requestImageFailedRetryDialog(
		mediaId
	);
}

export function requestImageUploadCancelDialog( mediaId ) {
	return RNReactNativeGutenbergBridge.requestImageUploadCancelDialog(
		mediaId
	);
}

export function requestImageUploadCancel( mediaId ) {
	return RNReactNativeGutenbergBridge.requestImageUploadCancel( mediaId );
}

export function getOtherMediaOptions( filter, callback ) {
	return RNReactNativeGutenbergBridge.getOtherMediaOptions(
		filter,
		callback
	);
}

export function requestImageFullscreenPreview(
	currentImageUrl,
	originalImageUrl
) {
	if ( isIOS ) {
		return RNReactNativeGutenbergBridge.requestImageFullscreenPreview(
			currentImageUrl,
			originalImageUrl
		);
	}
	return RNReactNativeGutenbergBridge.requestImageFullscreenPreview(
		originalImageUrl || currentImageUrl
	);
}

export function requestMediaEditor( mediaUrl, callback ) {
	return RNReactNativeGutenbergBridge.requestMediaEditor(
		mediaUrl,
		callback
	);
}

export function fetchRequest( path, enableCaching = true ) {
	if ( isAndroid ) {
		return RNReactNativeGutenbergBridge.fetchRequest( path, enableCaching );
	}
	return RNReactNativeGutenbergBridge.fetchRequest( path );
}

export function showUserSuggestions() {
	return RNReactNativeGutenbergBridge.showUserSuggestions();
}

export function showXpostSuggestions() {
	return RNReactNativeGutenbergBridge.showXpostSuggestions();
}

/**
 * Request the host app to show the block for editing its mediaFiles collection
 *
 * For example, a mediaFiles collection editor can make special handling of visualization
 * in this regard.
 *
 * @param {Array<Map>} mediaFiles the mediaFiles attribute of the block, containing data about each media item.
 * @param {string} blockClientId the clientId of the block.
 */
export function requestMediaFilesEditorLoad( mediaFiles, blockClientId ) {
	RNReactNativeGutenbergBridge.requestMediaFilesEditorLoad(
		mediaFiles,
		blockClientId
	);
}

/**
 * Request the host app to show a retry dialog for mediaFiles arrays which contained items that failed
 * to upload
 *
 * For example, tapping on a failed-media overlay would trigger this request and a "Retry?" dialog
 * would be presented to the user
 *
 * @param {Array<Map>} mediaFiles the mediaFiles attribute of the block, containing data about each media item
 */
export function requestMediaFilesFailedRetryDialog( mediaFiles ) {
	RNReactNativeGutenbergBridge.requestMediaFilesFailedRetryDialog(
		mediaFiles
	);
}

/**
 * Request the host app to show a cancel dialog for mediaFiles arrays currently being uploaded
 *
 * For example, tapping on a block containing mediaFiles that are currently being uplaoded would trigger this request
 * and a "Cancel upload?" dialog would be presented to the user.
 *
 * @param {Array<Map>} mediaFiles the mediaFiles attribute of the block, containing data about each media item
 */
export function requestMediaFilesUploadCancelDialog( mediaFiles ) {
	RNReactNativeGutenbergBridge.requestMediaFilesUploadCancelDialog(
		mediaFiles
	);
}

/**
 * Request the host app to show a cancel dialog for mediaFiles arrays currently undergoing a save operation
 *
 * Save operations on mediaFiles collection could  be lengthy so for example, tapping on a mediaFiles-type block
 * currently being saved would trigger this request and a "Cancel save?" dialog would be presented to the user
 *
 * @param {Array<Map>} mediaFiles the mediaFiles attribute of the block, containing data about each media item.
 */
export function requestMediaFilesSaveCancelDialog( mediaFiles ) {
	RNReactNativeGutenbergBridge.requestMediaFilesSaveCancelDialog(
		mediaFiles
	);
}

/**
 * Request the host app to listen to mediaFiles collection based block replacement signals
 * in case such an event was enqueued
 *
 * @param {Array<Map>} mediaFiles the mediaFiles attribute of the block, containing data about each media item.
 * @param {string} blockClientId the clientId of the block.
 */
export function mediaFilesBlockReplaceSync( mediaFiles, blockClientId ) {
	RNReactNativeGutenbergBridge.mediaFilesBlockReplaceSync(
		mediaFiles,
		blockClientId
	);
}

export function requestFocalPointPickerTooltipShown( callback ) {
	return RNReactNativeGutenbergBridge.requestFocalPointPickerTooltipShown(
		callback
	);
}

export function setFocalPointPickerTooltipShown( tooltipShown ) {
	return RNReactNativeGutenbergBridge.setFocalPointPickerTooltipShown(
		tooltipShown
	);
}

export default RNReactNativeGutenbergBridge;
