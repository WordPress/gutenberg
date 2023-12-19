/**
 * External dependencies
 */
import { FlatList, useWindowDimensions } from 'react-native';
import Animated, {
	useAnimatedScrollHandler,
	useSharedValue,
} from 'react-native-reanimated';

/**
 * WordPress dependencies
 */
import {
	useRef,
	forwardRef,
	useImperativeHandle,
	useEffect,
	useCallback,
} from '@wordpress/element';

/**
 * Internal dependencies
 */
import useKeyboardOffset from './use-keyboard-offset';
import useScrollToSection from './use-scroll-to-section';
import useScrollToElement from './use-scroll-to-element';
import KeyboardAvoidingView from '../keyboard-avoiding-view';

const AnimatedFlatList = Animated.createAnimatedComponent( FlatList );

export const KeyboardAwareFlatList = ( { onScroll, ...props }, ref ) => {
	const { extraScrollHeight, scrollEnabled, shouldPreventAutomaticScroll } =
		props;
	const scrollViewRef = useRef();
	const scrollViewMeasurements = useRef();
	const scrollViewYOffset = useSharedValue( -1 );
	const { height: windowHeight, width: windowWidth } = useWindowDimensions();
	const isLandscape = windowWidth >= windowHeight;

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

	// The function `scrollToSection`
	const [ keyboardOffset ] = useKeyboardOffset(
		scrollEnabled,
		shouldPreventAutomaticScroll
	);
	const [ scrollToSection ] = useScrollToSection(
		extraScrollHeight,
		keyboardOffset,
		scrollEnabled,
		scrollViewMeasurements,
		scrollViewRef,
		scrollViewYOffset
	);
	const [ scrollToElement ] = useScrollToElement(
		scrollViewRef,
		scrollToSection
	);

	const measureScrollView = useCallback( () => {
		if ( scrollViewRef.current ) {
			const scrollRef = scrollViewRef.current.getNativeScrollRef();

			scrollRef.measureInWindow( ( _x, y, width, height ) => {
				scrollViewMeasurements.current = { y, width, height };
			} );
		}
	}, [] );

	const onContentSizeChange = useCallback( () => {
		// Sets the first values when the content size changes.
		if ( ! scrollViewMeasurements.current ) {
			measureScrollView();
		}
	}, [ measureScrollView ] );

	useImperativeHandle( ref, () => {
		return {
			scrollViewRef: scrollViewRef.current,
			scrollToSection,
			scrollToElement,
		};
	} );

	return (
		<KeyboardAvoidingView style={ { flex: 1 } }>
			<AnimatedFlatList
				ref={ scrollViewRef }
				onScroll={ scrollHandler }
				onContentSizeChange={ onContentSizeChange }
				{ ...props }
			/>
		</KeyboardAvoidingView>
	);
};

export default forwardRef( KeyboardAwareFlatList );
