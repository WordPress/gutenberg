/**
 * External dependencies
 */

import { useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
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
 * @param {number}      extraScrollHeight Extra space to not overlap the content.
 * @param {number}      keyboardOffset    Keyboard space offset.
 * @param {boolean}     scrollEnabled     Whether the scroll is enabled or not.
 * @param {RefObject}   scrollViewRef     ScrollView reference.
 * @param {SharedValue} scrollViewYOffset Current offset position of the ScrollView.
 * @return {Function[]} Function to scroll to the current TextInput's offset.
 */
export default function useScrollToTextInput(
	extraScrollHeight,
	keyboardOffset,
	scrollEnabled,
	scrollViewRef,
	scrollViewYOffset
) {
	const { height: windowHeight } = useWindowDimensions();
	const { top, bottom } = useSafeAreaInsets();
	const availableScreenOffset = Math.round(
		windowHeight - ( top + bottom ) - ( keyboardOffset + extraScrollHeight )
	);

	const shouldScrollUp = useCallback(
		( textInputOffset, caretHeight ) => {
			const offset = textInputOffset - caretHeight;
			return offset < scrollViewYOffset.value;
		},
		[ scrollViewYOffset ]
	);

	const shouldScrollDown = useCallback(
		( textInputOffset, extraPadding ) => {
			const offset =
				scrollViewYOffset.value + availableScreenOffset - extraPadding;
			return textInputOffset > offset;
		},
		[ availableScreenOffset, scrollViewYOffset ]
	);

	const scrollToTextInputOffset = useCallback(
		( caret, textInputOffset ) => {
			const { caretHeight = DEFAULT_FONT_SIZE } = caret ?? {};
			const extraPadding = caretHeight * 2;

			if ( ! scrollViewRef.current || ! scrollEnabled ) {
				return;
			}

			if ( shouldScrollUp( textInputOffset, caretHeight ) ) {
				const scrollUpOffset = scrollViewYOffset.value - extraPadding;
				scrollViewRef.current.scrollTo( {
					y: scrollUpOffset,
					animated: true,
				} );
				return;
			}

			if ( shouldScrollDown( textInputOffset, extraPadding ) ) {
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
		},
		[
			availableScreenOffset,
			extraScrollHeight,
			scrollEnabled,
			scrollViewRef,
			scrollViewYOffset,
			shouldScrollDown,
			shouldScrollUp,
		]
	);

	return [ scrollToTextInputOffset ];
}
