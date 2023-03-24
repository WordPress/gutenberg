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
 * @param {number}      extraScrollHeight      Extra space to not overlap the content.
 * @param {number}      keyboardOffset         Keyboard space offset.
 * @param {boolean}     scrollEnabled          Whether the scroll is enabled or not.
 * @param {RefObject}   scrollViewMeasurements ScrollView Layout measurements.
 * @param {RefObject}   scrollViewRef          ScrollView reference.
 * @param {SharedValue} scrollViewYOffset      Current offset position of the ScrollView.
 * @return {Function[]} Function to scroll to the current TextInput's offset.
 */
export default function useScrollToTextInput(
	extraScrollHeight,
	keyboardOffset,
	scrollEnabled,
	scrollViewMeasurements,
	scrollViewRef,
	scrollViewYOffset
) {
	const scrollToTextInputOffset = useCallback(
		( caret, textInputOffset ) => {
			const { caretHeight = DEFAULT_FONT_SIZE } = caret ?? {};

			if (
				! scrollViewRef.current ||
				! scrollEnabled ||
				! scrollViewMeasurements.current
			) {
				return;
			}
			const availableScreenSpace =
				scrollViewMeasurements.current.height -
				( keyboardOffset + extraScrollHeight + caretHeight );
			const maxOffset = scrollViewYOffset.value + availableScreenSpace;

			// Scroll up.
			if ( textInputOffset < scrollViewYOffset.value ) {
				scrollViewRef.current.scrollTo( {
					y: textInputOffset,
					animated: true,
				} );
				return;
			}

			// Scroll down.
			if ( textInputOffset > maxOffset ) {
				scrollViewRef.current.scrollTo( {
					y: textInputOffset - availableScreenSpace,
					animated: true,
				} );
			}
		},
		[
			extraScrollHeight,
			keyboardOffset,
			scrollEnabled,
			scrollViewMeasurements,
			scrollViewRef,
			scrollViewYOffset.value,
		]
	);

	return [ scrollToTextInputOffset ];
}
