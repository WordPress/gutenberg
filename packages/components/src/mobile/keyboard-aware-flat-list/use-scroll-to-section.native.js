/**
 * External dependencies
 */
import { useSafeAreaInsets } from 'react-native-safe-area-context';

/**
 * WordPress dependencies
 */
import { useCallback } from '@wordpress/element';

/** @typedef {import('@wordpress/element').RefObject} RefObject */
/** @typedef {import('react-native-reanimated').SharedValue} SharedValue */
/**
 * Hook to scroll to a specified section by taking into account the Keyboard
 * and the Header.
 *
 * @param {number}      extraScrollHeight      Extra space to not overlap the content.
 * @param {number}      keyboardOffset         Keyboard space offset.
 * @param {boolean}     scrollEnabled          Whether the scroll is enabled or not.
 * @param {RefObject}   scrollViewMeasurements ScrollView Layout measurements.
 * @param {RefObject}   scrollViewRef          Scroll view reference.
 * @param {SharedValue} scrollViewYOffset      Current offset position of the ScrollView.
 * @return {Function[]} Function to scroll to a section.
 */
export default function useScrollToSection(
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
	 * Function to scroll to a section.
	 *
	 * @param {Object} section        Section data to scroll to.
	 * @param {number} section.y      Y-coordinate of of the section.
	 * @param {number} section.height Height of the section.
	 */
	const scrollToSection = useCallback(
		( sectionY, sectionHeight ) => {
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

			// Scroll to the top of the section.
			if ( sectionY < currentScrollViewYOffset ) {
				scrollViewRef.current.scrollTo( {
					y: sectionY,
					animated: true,
				} );
				return;
			}

			const availableScreenSpace = Math.abs(
				Math.floor(
					scrollViewMeasurements.current.height -
						( keyboardOffset + extraScrollHeight + sectionHeight )
				)
			);
			const maxOffset = Math.floor(
				currentScrollViewYOffset + availableScreenSpace
			);

			const isAtTheTop =
				sectionY < scrollViewMeasurements.current.y + insets;

			// Scroll to the bottom of the section.
			if ( sectionY > maxOffset && ! isAtTheTop ) {
				scrollViewRef.current.scrollTo( {
					y: sectionY - availableScreenSpace,
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

	return [ scrollToSection ];
}
