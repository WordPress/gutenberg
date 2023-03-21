/**
 * External dependencies
 */

import { useWindowDimensions } from 'react-native';

/**
 * WordPress dependencies
 */
import { useCallback } from '@wordpress/element';

const DEFAULT_FONT_SIZE = 16;

/** @typedef {import('@wordpress/element').RefObject} RefObject */
/** @typedef {import('react-native-reanimated').SharedValue} SharedValue */
/**
 * Hook to scroll to the currently focused TextInput
 * depending on where the caret is placed taking into
 * account the Keyboard and the Header.
 *
 * @param {Object}      currentCaretData  Current caret's data.
 * @param {number}      extraScrollHeight Extra space to not overlap the content.
 * @param {boolean}     isKeyboardVisible Whether the Keyboard is visible or not.
 * @param {number}      keyboardOffset    Keyboard space offset.
 * @param {boolean}     scrollEnabled     Whether the scroll is enabled or not.
 * @param {RefObject}   scrollViewRef     ScrollView reference.
 * @param {SharedValue} scrollViewYOffset Current offset position of the ScrollView.
 * @param {number}      textInputOffset   Currently focused TextInput offset.
 * @return {Function[]} Function to scroll to the current TextInput's offset.
 */
export default function useScrollToTextInput(
	currentCaretData,
	extraScrollHeight,
	isKeyboardVisible,
	keyboardOffset,
	scrollEnabled,
	scrollViewRef,
	scrollViewYOffset,
	textInputOffset
) {
	const { height: windowHeight } = useWindowDimensions();
	const { caretHeight = DEFAULT_FONT_SIZE } = currentCaretData ?? {};
	const availableScreenOffset = Math.round(
		windowHeight - ( keyboardOffset + extraScrollHeight )
	);
	const extraPadding = caretHeight * 2;

	const shouldScrollUp = useCallback( () => {
		const offset = textInputOffset - caretHeight;
		return offset < scrollViewYOffset.value;
	}, [ caretHeight, scrollViewYOffset, textInputOffset ] );

	const shouldScrollDown = useCallback( () => {
		const offset =
			scrollViewYOffset.value + availableScreenOffset - extraPadding;
		return textInputOffset > offset;
	}, [
		availableScreenOffset,
		extraPadding,
		scrollViewYOffset,
		textInputOffset,
	] );

	const scrollToTextInputOffset = useCallback( () => {
		if (
			! scrollViewRef.current ||
			! scrollEnabled ||
			( isKeyboardVisible && keyboardOffset === 0 )
		) {
			return;
		}

		if ( shouldScrollUp() ) {
			const scrollUpOffset = scrollViewYOffset.value - extraPadding;
			scrollViewRef.current.scrollTo( {
				y: scrollUpOffset,
				animated: true,
			} );
			return;
		}

		if ( shouldScrollDown() ) {
			const scrollDownOffset =
				textInputOffset +
				extraScrollHeight -
				availableScreenOffset +
				extraPadding;
			scrollViewRef.current.scrollTo( {
				y: scrollDownOffset,
				animated: true,
			} );
		}
	}, [
		availableScreenOffset,
		extraPadding,
		extraScrollHeight,
		isKeyboardVisible,
		keyboardOffset,
		scrollEnabled,
		scrollViewRef,
		scrollViewYOffset,
		shouldScrollDown,
		shouldScrollUp,
		textInputOffset,
	] );

	return [ scrollToTextInputOffset ];
}
