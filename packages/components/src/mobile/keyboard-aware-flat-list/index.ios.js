/**
 * External dependencies
 */

import { ScrollView, FlatList } from 'react-native';
import Animated, {
	useAnimatedScrollHandler,
	useSharedValue,
} from 'react-native-reanimated';

/**
 * WordPress dependencies
 */
import { useCallback, useEffect, useRef } from '@wordpress/element';

/**
 * Internal dependencies
 */
import useTextInputOffset from './use-text-input-offset';
import useKeyboardOffset from './use-keyboard-offset';
import useScrollToTextInput from './use-scroll-to-text-input';

const AnimatedScrollView = Animated.createAnimatedComponent( ScrollView );

export const KeyboardAwareFlatList = ( {
	extraScrollHeight,
	innerRef,
	onScroll,
	scrollEnabled,
	shouldPreventAutomaticScroll,
	...props
} ) => {
	const listRef = useRef();
	const scrollViewMeasurements = useRef();
	const latestContentOffsetY = useSharedValue( -1 );

	const [ isKeyboardVisible, keyboardOffset ] =
		useKeyboardOffset( scrollEnabled );

	const [ textInputOffset ] = useTextInputOffset( scrollEnabled );

	const [ scrollToTextInputOffset ] = useScrollToTextInput(
		extraScrollHeight,
		isKeyboardVisible,
		keyboardOffset,
		latestContentOffsetY,
		listRef,
		scrollEnabled,
		scrollViewMeasurements,
		textInputOffset
	);

	const scrollHandler = useAnimatedScrollHandler( {
		onScroll: ( event ) => {
			const { contentOffset } = event;
			latestContentOffsetY.value = contentOffset.y;
			onScroll( event );
		},
	} );

	useEffect( () => {
		// If the Keyboard is visible it also checks that the keyboard's offset
		// is not 0 since the value is updated when the Keyboard is fully visible.
		if (
			( isKeyboardVisible && keyboardOffset !== 0 ) ||
			textInputOffset
		) {
			scrollToTextInputOffset();
		}
	}, [
		isKeyboardVisible,
		keyboardOffset,
		textInputOffset,
		scrollToTextInputOffset,
	] );

	const measureScrollView = useCallback( () => {
		if ( listRef.current && ! scrollViewMeasurements.current ) {
			const scrollRef = listRef.current.getNativeScrollRef();

			scrollRef.measureInWindow( ( _x, y, _width, height ) => {
				scrollViewMeasurements.current = { y, height };
			} );
		}
	}, [] );

	const onContentSizeChange = useCallback( () => {
		// Measures the ScrollView to get the Y coordinate and height values.
		measureScrollView();
		scrollToTextInputOffset();
	}, [ scrollToTextInputOffset, measureScrollView ] );

	const getRef = useCallback(
		( ref ) => {
			listRef.current = ref;
			innerRef( ref );
		},
		[ innerRef ]
	);

	// Adds content insets when the keyboard is opened to have
	// extra padding at the bottom.
	const contentInset = { bottom: keyboardOffset };

	return (
		<AnimatedScrollView
			automaticallyAdjustContentInsets={ false }
			contentInset={ contentInset }
			keyboardShouldPersistTaps="handled"
			onContentSizeChange={ onContentSizeChange }
			onScroll={ scrollHandler }
			ref={ getRef }
			scrollEnabled={ scrollEnabled }
			scrollEventThrottle={ 16 }
		>
			<FlatList { ...props } />
		</AnimatedScrollView>
	);
};

export default KeyboardAwareFlatList;
