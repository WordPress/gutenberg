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
import useTextInputCaretPosition from './use-text-input-caret-position';

const AnimatedScrollView = Animated.createAnimatedComponent( ScrollView );

export const KeyboardAwareFlatList = ( {
	extraScrollHeight,
	innerRef,
	onScroll,
	scrollEnabled,
	shouldPreventAutomaticScroll,
	...props
} ) => {
	const scrollViewRef = useRef();
	const scrollViewYOffset = useSharedValue( -1 );

	const [ isKeyboardVisible, keyboardOffset ] =
		useKeyboardOffset( scrollEnabled );

	const [ currentCaretData ] = useTextInputCaretPosition( scrollEnabled );
	const [ textInputOffset ] = useTextInputOffset(
		currentCaretData,
		scrollEnabled,
		scrollViewRef
	);

	const [ scrollToTextInputOffset ] = useScrollToTextInput(
		currentCaretData,
		extraScrollHeight,
		isKeyboardVisible,
		keyboardOffset,
		scrollEnabled,
		scrollViewRef,
		scrollViewYOffset,
		textInputOffset
	);

	const scrollHandler = useAnimatedScrollHandler( {
		onScroll: ( event ) => {
			const { contentOffset } = event;
			scrollViewYOffset.value = contentOffset.y;
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

	const getRef = useCallback(
		( ref ) => {
			scrollViewRef.current = ref;
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
