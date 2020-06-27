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

export const userEvents = {
	editorSessionTemplateApply: 'editor_session_template_apply',
	editorSessionTemplatePreview: 'editor_session_template_preview',
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

export function subscribeMediaUpload( callback ) {
	return gutenbergBridgeEvents.addListener( 'mediaUpload', callback );
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
 * @param {string} blockName the user-facing, localized block name.
 */
export function requestUnsupportedBlockFallback(
	htmlContent,
	blockClientId,
	blockName
) {
	RNReactNativeGutenbergBridge.requestUnsupportedBlockFallback(
		htmlContent,
		blockClientId,
		blockName
	);
}

export function requestMediaImport( url, callback ) {
	return RNReactNativeGutenbergBridge.requestMediaImport( url, callback );
}

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

export function fetchRequest( path ) {
	return RNReactNativeGutenbergBridge.fetchRequest( path );
}

export function logUserEvent( event, properties ) {
	return RNReactNativeGutenbergBridge.logUserEvent( event, properties );
}

export function addMention() {
	return RNReactNativeGutenbergBridge.addMention();
}

export function requestStarterPageTemplatesTooltipShown( callback ) {
	return RNReactNativeGutenbergBridge.requestStarterPageTemplatesTooltipShown(
		callback
	);
}

export function setStarterPageTemplatesTooltipShown( tooltipShown ) {
	return RNReactNativeGutenbergBridge.setStarterPageTemplatesTooltipShown(
		tooltipShown
	);
}

export default RNReactNativeGutenbergBridge;
