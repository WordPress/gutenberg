/** @format */

import { NativeModules, DeviceEventEmitter } from 'react-native';

const { RNReactNativeGutenbergBridge } = NativeModules;

export function registerBridgeListener( eventName, listener ) {
	DeviceEventEmitter.addListener( eventName, listener );
}

export default RNReactNativeGutenbergBridge;
