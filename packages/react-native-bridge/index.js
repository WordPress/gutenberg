/**
 * External dependencies
 */
import { NativeModules, NativeEventEmitter, Platform } from 'react-native';

/**
 * WordPress dependencies
 */
import RCTAztecView from '@wordpress/react-native-aztec';

/**
 * Internal dependencies
 */
import parseException from './lib/parseException';

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

// Console polyfill from react-native.

export function nativeLoggingHook( message, logLevel ) {
	RNReactNativeGutenbergBridge.editorDidEmitLog( message, logLevel );
}

// Send messages.

export function sendNativeEditorDidLayout() {
	// For now, this is only needed on iOS to solve layout issues with the toolbar.
	// If this become necessary on Android in the future, we can try to build a registration API from Native
	// to register messages it wants to receive, similar to the Native -> JS messages listener system.
	if ( isIOS ) {
		RNReactNativeGutenbergBridge.editorDidLayout();
	}
}

// Register listeners.

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
	return gutenbergBridgeEvents.addListener(
		'featuredImageIdNativeUpdated',
		callback
	);
}

export function subscribePostSaveEvent( callback ) {
	return gutenbergBridgeEvents.addListener(
		'postHasBeenJustSaved',
		callback
	);
}

/**
 * Request to subscribe to mediaUpload events
 *
 * When a media item exists as a local file and is to be uploaded, these are the generated events that are useful listening to.
 * see subscribeMediaSave for events during a save operation.
 *
 * @param {Function} callback RN Callback function to be called with the following
 *                            state and params:
 *                            state:
 *                            MEDIA_UPLOAD_STATE_SAVING: this is a progress update. Takes String mediaId, float progress.
 *                            MEDIA_UPLOAD_STATE_SUCCEEDED: sent when one media is finished being saved. Takes String mediaId, String mediaUrl, String serverID
 *                            (which is the remote id assigned to this file after having been uploaded).
 *                            MEDIA_UPLOAD_STATE_FAILED: sent in case of saving failure (final state). Takes String mediaId.
 *                            MEDIA_UPLOAD_STATE_RESET: sent when the progress and state needs be reset (a retry for example, for cleanup). Takes String mediaId.
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
 * @param {Function} callback RN Callback function to be called with the following
 *                            state and params:
 *                            Note that the first 4 states described are similar to upload events.
 *                            state:
 *                            MEDIA_SAVE_STATE_SAVING: this is a progress update. Takes String mediaId, float progress.
 *                            MEDIA_SAVE_STATE_SUCCEEDED: sent when one media is finished being saved. Takes String mediaId, String mediaUrl.
 *                            MEDIA_SAVE_STATE_FAILED: sent in case of saving failure (final state). Takes String mediaId.
 *                            MEDIA_SAVE_STATE_RESET: sent when the progress and state needs be reset (a retry for example, for cleanup). Takes String mediaId.
 *                            MEDIA_SAVE_FINAL_STATE_RESULT: used in media collections, sent when ALL media items in a collection have reached
 *                            a final state (either FAILED or SUCCEEDED). Handy to know when to show a final state to the user, on
 *                            a media collection based block when we don't know if there are still events to be received for other
 *                            items in the collection.
 *                            MEDIA_SAVE_MEDIAID_CHANGED:	used when changing a media item id from a temporary id to a local file id, and then from a local file
 *                            id to a remote file id.
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

export function subscribeUpdateEditorSettings( callback ) {
	return gutenbergBridgeEvents.addListener(
		'updateEditorSettings',
		callback
	);
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
 * @param {string} html     the HTML to replace the block.
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
 * Subscribe a listener for handling requests to open the editor help topics page.
 *
 * @param {Function} callback RN Callback function to display the editor
 *                            help topics.
 */
export function subscribeShowEditorHelp( callback ) {
	return gutenbergBridgeEvents.addListener( 'showEditorHelp', callback );
}

export function subscribeOnUndoPressed( callback ) {
	return gutenbergBridgeEvents.addListener( 'onUndoPressed', callback );
}

export function subscribeOnRedoPressed( callback ) {
	return gutenbergBridgeEvents.addListener( 'onRedoPressed', callback );
}

export function subscribeConnectionStatus( callback ) {
	return gutenbergBridgeEvents.addListener(
		'connectionStatusChange',
		callback
	);
}

/**
 * Subscribes a callback function to the 'onContentUpdate' event.
 * This event is triggered with content that will be passed to the block editor
 * to be converted into blocks.
 *
 * @param {Function} callback The function to be called when the 'onContentUpdate' event is triggered.
 *                            This function receives content plain text/markdown as an argument.
 * @return {Object} The listener object that was added to the event.
 */
export function subscribeToContentUpdate( callback ) {
	return gutenbergBridgeEvents.addListener( 'onContentUpdate', callback );
}

export function requestConnectionStatus( callback ) {
	return RNReactNativeGutenbergBridge.requestConnectionStatus( callback );
}

/**
 * Request media picker for the given media source.
 *
 * Kinds of media source can be device library, camera, etc.
 *
 * @param {string}        source   The media source to request media from.
 * @param {Array<string>} filter   Array of media types to filter the media to select.
 * @param {boolean}       multiple Is multiple selection allowed?
 * @param {Function}      callback RN Callback function to be called with the selected media objects.
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
 * Request to render an unsupported block.
 *
 * A way to show unsupported blocks to the user is to render it on a web view.
 *
 * @param {string} htmlContent   Raw html content of the block.
 * @param {string} blockClientId the clientId of the block.
 * @param {string} blockName     the internal system block name.
 * @param {string} blockTitle    the user-facing, localized block name.
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

export function setFeaturedImage( mediaId ) {
	return RNReactNativeGutenbergBridge.setFeaturedImage( mediaId );
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

export function requestEmbedFullscreenPreview( content, title ) {
	if ( isIOS ) {
		/* eslint-disable-next-line no-console */
		console.warn( 'requestEmbedFullscreenPreview is not supported on iOS' );
		return;
	}
	return RNReactNativeGutenbergBridge.requestEmbedFullscreenPreview(
		content,
		title
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

export function postRequest( path, data = {} ) {
	return RNReactNativeGutenbergBridge.postRequest( path, data );
}

export function showUserSuggestions() {
	return RNReactNativeGutenbergBridge.showUserSuggestions();
}

export function showXpostSuggestions() {
	return RNReactNativeGutenbergBridge.showXpostSuggestions();
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

export function requestPreview() {
	RNReactNativeGutenbergBridge.requestPreview();
}

/**
 * Request the host app provide the latest block type impression counts.
 *
 * @param {Function} callback Callback invoked with object containing counts for each block type.
 * @return {void}
 */
export function requestBlockTypeImpressions( callback ) {
	return RNReactNativeGutenbergBridge.requestBlockTypeImpressions( callback );
}

/**
 * Request the host app set updated impression count for a given block type identified by name.
 *
 * @param {Object} impressions Key-value pairs of block type name and impression count.
 * @return {void}
 */
export function setBlockTypeImpressions( impressions ) {
	return RNReactNativeGutenbergBridge.setBlockTypeImpressions( impressions );
}

export function requestContactCustomerSupport() {
	RNReactNativeGutenbergBridge.requestContactCustomerSupport();
}

export function requestGotoCustomerSupportOptions() {
	RNReactNativeGutenbergBridge.requestGotoCustomerSupportOptions();
}

/**
 * Request the host app receive an event with properties.
 *
 * @param {string} eventName  Name representing to the event.
 * @param {Object} properties Key-value pairs of event properties.
 * @return {void}
 */
export function sendEventToHost( eventName, properties ) {
	return RNReactNativeGutenbergBridge.sendEventToHost(
		eventName,
		properties
	);
}

/**
 * Shows Android's soft keyboard if there's a TextInput focused and
 * the keyboard is hidden.
 *
 * @return {void}
 */
export function showAndroidSoftKeyboard() {
	if ( isIOS ) {
		return;
	}

	const hasFocusedTextInput = RCTAztecView.InputState.isFocused();

	if ( hasFocusedTextInput ) {
		RNReactNativeGutenbergBridge.showAndroidSoftKeyboard();
	}
}

/**
 * Hides Android's soft keyboard.
 *
 * @return {void}
 */
export function hideAndroidSoftKeyboard() {
	if ( isIOS ) {
		return;
	}

	RNReactNativeGutenbergBridge.hideAndroidSoftKeyboard();
}

/**
 * Generate haptic feedback.
 */
export function generateHapticFeedback() {
	RNReactNativeGutenbergBridge.generateHapticFeedback();
}

export function toggleUndoButton( isDisabled ) {
	RNReactNativeGutenbergBridge.toggleUndoButton( isDisabled );
}

export function toggleRedoButton( isDisabled ) {
	RNReactNativeGutenbergBridge.toggleRedoButton( isDisabled );
}

/**
 * Log exception to host app's crash logging service.
 * @param {Object}   exception         Exception object
 * @param {Object}   [extra]           Extra parameters to include in the exception.
 * @param {Object}   [extra.context]   Context of the exception.
 * @param {Object}   [extra.tags]      Tags to associate with the exception.
 * @param {Object}   [extra.isHandled] True if the exception is handled.
 * @param {Object}   [extra.handledBy] The mechanism that detected the exception.
 * @param {Function} [callback]        Callback triggered when the exception is sent.
 */
export function logException(
	exception,
	{ context, tags, isHandled, handledBy } = {
		context: {},
		tags: {},
		isHandled: false,
		handledBy: 'Unknown',
	},
	callback
) {
	const parsedException = {
		...parseException( exception, { context, tags } ),
		isHandled,
		handledBy,
	};

	const onLogException = ( wasSent ) => {
		if ( ! wasSent ) {
			// eslint-disable-next-line no-console
			console.error(
				'An error ocurred when logging the exception',
				parsedException
			);
		}
		if ( callback ) {
			callback();
		}
	};

	// Only log exceptions in production
	// eslint-disable-next-line no-undef
	if ( __DEV__ ) {
		// eslint-disable-next-line no-console
		console.info( 'Exception that would be logged', parsedException );
		if ( callback ) {
			callback();
		}
		return;
	}

	RNReactNativeGutenbergBridge.logException(
		parsedException,
		onLogException
	);
}

export default RNReactNativeGutenbergBridge;
