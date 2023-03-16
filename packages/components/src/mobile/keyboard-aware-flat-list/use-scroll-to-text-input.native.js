/**
 * External dependencies
 */

import { useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

/**
 * WordPress dependencies
 */
import { useCallback } from '@wordpress/element';

/** @typedef {import('@wordpress/element').RefObject} RefObject */
/** @typedef {import('react-native-reanimated').SharedValue} SharedValue */
/**
 * Hook to scroll to the currently focused TextInput
 * depending on where the caret is placed taking into
 * account the Keyboard and the Header.
 *
 * @param {number}      extraScrollHeight      Extra space to not overlap the content.
 * @param {boolean}     isKeyboardVisible      Whether the Keyboard is visible or not.
 * @param {number}      keyboardOffset         Keyboard space offset.
 * @param {SharedValue} latestContentOffsetY   Current offset position of the ScrollView.
 * @param {RefObject}   listRef                ScrollView reference.
 * @param {boolean}     scrollEnabled          Whether the scroll is enabled or not.
 * @param {RefObject}   scrollViewMeasurements ScrollView component's measurements.
 * @param {number}      textInputOffset        Currently focused TextInput offset.
 * @return {Function[]} Function to scroll to the current TextInput's offset.
 */
export default function useScrollToTextInput(
	extraScrollHeight,
	isKeyboardVisible,
	keyboardOffset,
	latestContentOffsetY,
	listRef,
	scrollEnabled,
	scrollViewMeasurements,
	textInputOffset
) {
	const { height: windowHeight } = useWindowDimensions();
	const { top, bottom } = useSafeAreaInsets();
	const availableScreenOffset = Math.round(
		windowHeight - ( top + bottom ) - ( keyboardOffset + extraScrollHeight )
	);

	const shouldScrollUp = useCallback( () => {
		return (
			listRef.current &&
			textInputOffset < scrollViewMeasurements.current.y
		);
	}, [ listRef, scrollViewMeasurements, textInputOffset ] );

	const shouldScrollDown = useCallback( () => {
		return listRef.current && textInputOffset >= availableScreenOffset;
	}, [ listRef, textInputOffset, availableScreenOffset ] );

	const scrollToTextInputOffset = useCallback( () => {
		if (
			! scrollEnabled ||
			! scrollViewMeasurements.current ||
			( isKeyboardVisible && keyboardOffset === 0 )
		) {
			return;
		}

		if ( shouldScrollUp() ) {
			listRef.current.scrollTo( {
				y: latestContentOffsetY.value - textInputOffset,
				animated: true,
			} );
			return;
		}

		if ( shouldScrollDown() ) {
			const scrollDownOffset =
				latestContentOffsetY.value +
				( textInputOffset - availableScreenOffset );
			listRef.current.scrollTo( {
				y: scrollDownOffset,
				animated: true,
			} );
		}
	}, [
		availableScreenOffset,
		isKeyboardVisible,
		keyboardOffset,
		latestContentOffsetY,
		listRef,
		scrollEnabled,
		scrollViewMeasurements,
		shouldScrollDown,
		shouldScrollUp,
		textInputOffset,
	] );

	return [ scrollToTextInputOffset ];
}
