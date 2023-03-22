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

	const [ getTextInputOffset ] = useTextInputOffset(
		scrollEnabled,
		scrollViewRef
	);

	const [ scrollToTextInputOffset ] = useScrollToTextInput(
		extraScrollHeight,
		keyboardOffset,
		scrollEnabled,
		scrollViewRef,
		scrollViewYOffset
	);

	const onScrollToTextInput = useCallback(
		async ( caret ) => {
			const textInputOffset = await getTextInputOffset( caret );

			if ( textInputOffset !== null || textInputOffset !== null ) {
				scrollToTextInputOffset( caret, textInputOffset );
			}
		},
		[ getTextInputOffset, scrollToTextInputOffset ]
	);

	useEffect( () => {
		const caretY = currentCaretData?.caretY;
		if (
			( isKeyboardVisible && keyboardOffset !== 0 && caretY !== null ) ||
			caretY !== null
		) {
			onScrollToTextInput( currentCaretData );
		}
	}, [
		currentCaretData,
		isKeyboardVisible,
		keyboardOffset,
		onScrollToTextInput,
	] );

	const scrollHandler = useAnimatedScrollHandler( {
		onScroll: ( event ) => {
			const { contentOffset } = event;
			scrollViewYOffset.value = contentOffset.y;
			onScroll( event );
		},
	} );

	const onContentSizeChange = useCallback( () => {
		onScrollToTextInput( currentCaretData );
	}, [ onScrollToTextInput, currentCaretData ] );

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
