/**
 * External dependencies
 */

import { useWindowDimensions } from 'react-native';
import {
	useAnimatedScrollHandler,
	useSharedValue,
} from 'react-native-reanimated';

/**
 * WordPress dependencies
 */
import { useCallback, useEffect, useRef, Platform } from '@wordpress/element';

/**
 * Internal dependencies
 */
import useKeyboardOffset from './use-keyboard-offset';
import useScrollToSection from './use-scroll-to-section';
import useScrollToElement from './use-scroll-to-element';

export default function useScroll( {
	scrollEnabled,
	shouldPreventAutomaticScroll,
	onScroll,
	onSizeChange,
	extraScrollHeight,
} ) {
	const scrollViewRef = useRef();
	const nativeScrollRef = Platform.isAndroid
		? scrollViewRef.current?.getNativeScrollRef()
		: scrollViewRef.current;
	const scrollViewMeasurements = useRef();
	const scrollViewYOffset = useSharedValue( -1 );

	const { height: windowHeight, width: windowWidth } = useWindowDimensions();
	const isLandscape = windowWidth >= windowHeight;

	const [ keyboardOffset ] = useKeyboardOffset(
		scrollEnabled,
		shouldPreventAutomaticScroll
	);

	const scrollHandler = useAnimatedScrollHandler( {
		onScroll: ( event ) => {
			const { contentOffset } = event;
			scrollViewYOffset.value = contentOffset.y;
			onScroll( event );
		},
	} );

	// When the orientation changes, the ScrollView measurements
	// need to be re-calculated.
	useEffect( () => {
		scrollViewMeasurements.current = null;
	}, [ isLandscape ] );

	const [ scrollToSection ] = useScrollToSection(
		extraScrollHeight,
		keyboardOffset,
		scrollEnabled,
		scrollViewMeasurements,
		nativeScrollRef,
		scrollViewYOffset
	);
	const [ scrollToElement ] = useScrollToElement(
		nativeScrollRef,
		scrollToSection
	);

	const measureScrollView = useCallback( () => {
		if ( nativeScrollRef ) {
			nativeScrollRef.measureInWindow( ( _x, y, width, height ) => {
				scrollViewMeasurements.current = { y, width, height };
			} );
		}
	}, [ nativeScrollRef ] );

	const onContentSizeChange = useCallback( () => {
		if ( onSizeChange ) {
			onSizeChange();
		}

		// Sets the first values when the content size changes.
		if ( ! scrollViewMeasurements.current ) {
			measureScrollView();
		}
	}, [ measureScrollView, onSizeChange ] );

	return {
		scrollViewRef,
		scrollHandler,
		keyboardOffset,
		scrollToSection,
		scrollToElement,
		onContentSizeChange,
	};
}
