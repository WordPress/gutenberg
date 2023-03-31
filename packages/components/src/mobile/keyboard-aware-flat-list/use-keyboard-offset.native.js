/**
 * External dependencies
 */

import { Keyboard } from 'react-native';

/**
 * WordPress dependencies
 */
import { useEffect, useCallback, useState } from '@wordpress/element';

/**
 * Hook that adds Keyboard listeners to get the offset space
 * when the keyboard is opened, taking into account focused AztecViews.
 *
 * @param {boolean} scrollEnabled Whether the scroll is enabled or not.
 * @return {[number]} Keyboard offset.
 */
export default function useKeyboardOffset( scrollEnabled ) {
	const [ keyboardOffset, setKeyboardOffset ] = useState( 0 );

	const onKeyboardDidShow = useCallback( ( { endCoordinates } ) => {
		setKeyboardOffset( endCoordinates.height );
	}, [] );

	const onKeyboardDidHide = useCallback( () => {
		setKeyboardOffset( 0 );
	}, [] );

	useEffect( () => {
		let showSubscription;
		let hideSubscription;

		if ( scrollEnabled ) {
			showSubscription = Keyboard.addListener(
				'keyboardDidShow',
				onKeyboardDidShow
			);
			hideSubscription = Keyboard.addListener(
				'keyboardDidHide',
				onKeyboardDidHide
			);
		} else {
			showSubscription?.remove();
			hideSubscription?.remove();
		}

		return () => {
			showSubscription?.remove();
			hideSubscription?.remove();
		};
	}, [ scrollEnabled, onKeyboardDidShow, onKeyboardDidHide ] );
	return [ keyboardOffset ];
}
