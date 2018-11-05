/** @format */

import { NativeModules, NativeEventEmitter } from 'react-native';

const { RNReactNativeGutenbergBridge } = NativeModules;

const gutenbergBridgeEvents = new NativeEventEmitter( RNReactNativeGutenbergBridge );

export function subscribeParentGetHtml( callback ) {
	return gutenbergBridgeEvents.addListener( 'requestGetHtml', callback );
}
export function subscribeParentSetImageSource( callback ) {
	return gutenbergBridgeEvents.addListener( 'setImageSource', callback );
}

export default RNReactNativeGutenbergBridge;
