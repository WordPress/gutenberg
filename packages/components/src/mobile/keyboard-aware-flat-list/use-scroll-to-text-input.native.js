/**
 * External dependencies
 */
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
	const { top, bottom } = useSafeAreaInsets();
	const insets = top + bottom;

	/**
	 * Function to scroll to the current TextInput's offset.
	 *
	 * @param {Object} caret             The caret position data of the currently focused TextInput.
	 * @param {number} caret.caretHeight The height of the caret.
	 * @param {number} textInputOffset   The offset calculated with the caret's Y coordinate + the
	 *                                   TextInput's Y coord or height value.
	 */
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
			const currentScrollViewYOffset = Math.max(
				0,
				scrollViewYOffset.value
			);

			// Scroll up.
			if ( textInputOffset < currentScrollViewYOffset ) {
				scrollViewRef.current.scrollTo( {
					y: textInputOffset,
					animated: true,
				} );
				return;
			}

			const availableScreenSpace = Math.abs(
				Math.floor(
					scrollViewMeasurements.current.height -
						( keyboardOffset + extraScrollHeight + caretHeight )
				)
			);
			const maxOffset = Math.floor(
				currentScrollViewYOffset + availableScreenSpace
			);

			const isAtTheTop =
				textInputOffset < scrollViewMeasurements.current.y + insets;

			// Scroll down.
			if ( textInputOffset > maxOffset && ! isAtTheTop ) {
				scrollViewRef.current.scrollTo( {
					y: textInputOffset - availableScreenSpace,
					animated: true,
				} );
			}
		},
		[
			extraScrollHeight,
			insets,
			keyboardOffset,
			scrollEnabled,
			scrollViewMeasurements,
			scrollViewRef,
			scrollViewYOffset,
		]
	);

	return [ scrollToTextInputOffset ];
}
