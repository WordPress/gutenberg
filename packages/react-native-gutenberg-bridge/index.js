/** @format */

/**
 * External dependencies
 */
import { NativeModules, NativeEventEmitter, Platform } from 'react-native';

const { RNReactNativeGutenbergBridge } = NativeModules;
const isIOS = Platform.OS === 'ios';

const gutenbergBridgeEvents = new NativeEventEmitter( RNReactNativeGutenbergBridge );

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

export function requestMediaPickFromMediaLibrary( filter, callback ) {
	return RNReactNativeGutenbergBridge.requestMediaPickFrom( 'SITE_MEDIA_LIBRARY', filter, callback );
}

export function requestMediaPickFromDeviceLibrary( filter, callback ) {
	return RNReactNativeGutenbergBridge.requestMediaPickFrom( 'DEVICE_MEDIA_LIBRARY', filter, callback );
}

export function requestMediaPickFromDeviceCamera( filter, callback ) {
	return RNReactNativeGutenbergBridge.requestMediaPickFrom( 'DEVICE_CAMERA', filter, callback );
}

export function requestMediaImport( url, callback ) {
	return RNReactNativeGutenbergBridge.requestMediaImport( url, callback );
}

export function mediaUploadSync() {
	return RNReactNativeGutenbergBridge.mediaUploadSync();
}

export function requestImageFailedRetryDialog( mediaId ) {
	return RNReactNativeGutenbergBridge.requestImageFailedRetryDialog( mediaId );
}

export function requestImageUploadCancelDialog( mediaId ) {
	return RNReactNativeGutenbergBridge.requestImageUploadCancelDialog( mediaId );
}

export function requestImageUploadCancel( mediaId ) {
	return RNReactNativeGutenbergBridge.requestImageUploadCancel( mediaId );
}

export default RNReactNativeGutenbergBridge;
