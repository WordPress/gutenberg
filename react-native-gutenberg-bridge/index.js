/** @format */

import { NativeModules, NativeEventEmitter } from 'react-native';

const { RNReactNativeGutenbergBridge } = NativeModules;

const gutenbergBridgeEvents = new NativeEventEmitter( RNReactNativeGutenbergBridge );

export function subscribeParentGetHtml( callback ) {
	return gutenbergBridgeEvents.addListener( 'requestGetHtml', callback );
}

export function subscribeParentToggleHTMLMode( callback ) {
	return gutenbergBridgeEvents.addListener( 'toggleHTMLMode', callback );
}

export function subscribeUpdateHtml( callback ) {
	return gutenbergBridgeEvents.addListener( 'updateHtml', callback );
}

export default RNReactNativeGutenbergBridge;
