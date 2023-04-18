/**
 * External dependencies
 */

import { Keyboard } from 'react-native';

/**
 * WordPress dependencies
 */
import { useEffect, useCallback, useState, useRef } from '@wordpress/element';

/**
 * Hook that adds Keyboard listeners to get the offset space
 * when the keyboard is opened, taking into account focused AztecViews.
 *
 * @param {boolean}  scrollEnabled                Whether the scroll is enabled or not.
 * @param {Function} shouldPreventAutomaticScroll Whether to prevent scrolling when there's a Keyboard offset set.
 * @return {[number]} Keyboard offset.
 */
export default function useKeyboardOffset(
	scrollEnabled,
	shouldPreventAutomaticScroll
) {
	const [ keyboardOffset, setKeyboardOffset ] = useState( 0 );
	const timeoutRef = useRef();

	const onKeyboardDidHide = useCallback( () => {
		if ( shouldPreventAutomaticScroll() ) {
			clearTimeout( timeoutRef.current );
			return;
		}

		// A timeout is being used to delay resetting the offset in cases
		// where the focus is changed to a different TextInput.
		clearTimeout( timeoutRef.current );
		timeoutRef.current = setTimeout( () => {
			setKeyboardOffset( 0 );
		}, 200 );
	}, [ shouldPreventAutomaticScroll ] );

	const onKeyboardDidShow = useCallback( ( { endCoordinates } ) => {
		clearTimeout( timeoutRef.current );
		setKeyboardOffset( endCoordinates.height );
	}, [] );

	const onKeyboardWillShow = useCallback( () => {
		clearTimeout( timeoutRef.current );
	}, [] );

	useEffect( () => {
		let willShowSubscription;
		let showSubscription;
		let hideSubscription;

		if ( scrollEnabled ) {
			willShowSubscription = Keyboard.addListener(
				'keyboardWillShow',
				onKeyboardWillShow
			);
			showSubscription = Keyboard.addListener(
				'keyboardDidShow',
				onKeyboardDidShow
			);
			hideSubscription = Keyboard.addListener(
				'keyboardDidHide',
				onKeyboardDidHide
			);
		} else {
			willShowSubscription?.remove();
			showSubscription?.remove();
			hideSubscription?.remove();
		}

		return () => {
			clearTimeout( timeoutRef.current );
			willShowSubscription?.remove();
			showSubscription?.remove();
			hideSubscription?.remove();
		};
	}, [
		onKeyboardDidHide,
		onKeyboardDidShow,
		onKeyboardWillShow,
		scrollEnabled,
	] );
	return [ keyboardOffset ];
}
