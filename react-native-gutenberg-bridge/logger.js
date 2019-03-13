/** @format */
/* eslint no-console: 0 */

import { NativeModules } from 'react-native';

const { RNReactNativeGutenbergBridge } = NativeModules;

const logger = {
	debug: ( message ) => {
		console.debug( message );
		return RNReactNativeGutenbergBridge.debug( message );
	},
	info: ( message ) => {
		console.info( message );
		return RNReactNativeGutenbergBridge.info( message );
	},
	log: ( message ) => {
		console.log( message );
		return RNReactNativeGutenbergBridge.log( message );
	},
	warn: ( message ) => {
		console.warn( message );
		return RNReactNativeGutenbergBridge.warn( message );
	},
	error: ( message ) => {
		console.error( message );
		return RNReactNativeGutenbergBridge.error( message );
	},
};

export default logger;
