/** @format */

import { NativeModules, NativeEventEmitter, Platform } from 'react-native';

const { RNReactNativeGutenbergBridge } = NativeModules;
const isIOS = Platform.OS === 'ios';

const gutenbergBridgeEvents = new NativeEventEmitter( RNReactNativeGutenbergBridge );

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

export function subscribeSetTitle( callback ) {
	return gutenbergBridgeEvents.addListener( 'setTitle', callback );
}

export function subscribeUpdateHtml( callback ) {
	return gutenbergBridgeEvents.addListener( 'updateHtml', callback );
}

export function subscribeMediaUpload( callback ) {
	return gutenbergBridgeEvents.addListener( 'mediaUpload', callback );
}

export function onMediaLibraryPressed( callback ) {
	return RNReactNativeGutenbergBridge.onMediaLibraryPressed( callback );
}

export function onUploadMediaPressed( callback ) {
	return RNReactNativeGutenbergBridge.onUploadMediaPressed( callback );
}

export function onCapturePhotoPressed( callback ) {
	return RNReactNativeGutenbergBridge.onCapturePhotoPressed( callback );
}

export function onImageQueryReattach() {
	return RNReactNativeGutenbergBridge.onImageQueryReattach();
}

export default RNReactNativeGutenbergBridge;
