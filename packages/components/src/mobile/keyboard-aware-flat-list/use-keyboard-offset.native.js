/**
 * External dependencies
 */

import { Keyboard } from 'react-native';

/**
 * WordPress dependencies
 */
import RCTAztecView from '@wordpress/react-native-aztec';
import { useEffect, useState } from '@wordpress/element';

/**
 * Hook that adds Keyboard listeners to get the offset space
 * when the keyboard is opened, taking into account focused AztecViews.
 *
 * @param {boolean} scrollEnabled Whether the scroll is enabled or not.
 * @return {[boolean, number]} Keyboard visibility state and Keyboard offset.
 */
export default function useKeyboardOffset( scrollEnabled ) {
	const [ keyboardOffset, setKeyboardOffset ] = useState( 0 );
	const [ isKeyboardVisible, setIsKeyboardVisible ] = useState( false );

	useEffect( () => {
		let willShowSubscription;
		let showSubscription;
		let hideSubscription;

		if ( scrollEnabled ) {
			willShowSubscription = Keyboard.addListener(
				'keyboardWillShow',
				() => {
					setIsKeyboardVisible( true );
				}
			);
			showSubscription = Keyboard.addListener(
				'keyboardDidShow',
				( { endCoordinates } ) => {
					setKeyboardOffset( endCoordinates.height );
				}
			);
			hideSubscription = Keyboard.addListener( 'keyboardWillHide', () => {
				// Changing focus between TextInputs triggers this listener as the
				// Keyboard gets dimissed and then shows up again, so it's needed to
				// avoid setting the keyboard offset to 0 unless there's no focused input.
				if ( ! RCTAztecView.InputState.isFocused() ) {
					setKeyboardOffset( 0 );
				}
				setIsKeyboardVisible( false );
			} );
		}
		return () => {
			willShowSubscription?.remove();
			showSubscription?.remove();
			hideSubscription?.remove();
		};
	}, [ scrollEnabled ] );
	return [ isKeyboardVisible, keyboardOffset ];
}
