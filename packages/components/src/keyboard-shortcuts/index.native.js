/**
 * WordPress dependencies
 */
import { useEffect } from '@wordpress/element';
/**
 * External dependencies
 */
import { NativeModules, NativeEventEmitter } from 'react-native';
const { RNReactNativeGutenbergBridge } = NativeModules;
const gutenbergBridgeEvents = new NativeEventEmitter( RNReactNativeGutenbergBridge );

const mapFromCharacterToEvent = ( character ) => {
	switch ( character ) {
		case 'b': return 'toggleBold';
		case 'i': return 'toggleItalic';
		case 'k': return 'addEditLink';
	}
};

const KeyboardShortcuts = ( { character, onUse } ) => {
	useEffect( () => {
		const event = mapFromCharacterToEvent( character );
		if ( ! event ) {
			return;
		}
		if ( gutenbergBridgeEvents.listeners( event ).length > 0 ) {
			return;
		}
		gutenbergBridgeEvents.addListener( event, onUse );
		return () => {
			gutenbergBridgeEvents.removeListener( onUse );
		};
	} );
	return null;
};
export default KeyboardShortcuts;
