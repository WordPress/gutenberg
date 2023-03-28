/**
 * External dependencies
 */

import { ScrollView, FlatList, useWindowDimensions } from 'react-native';
import Animated, {
	useAnimatedScrollHandler,
	useSharedValue,
} from 'react-native-reanimated';

/**
 * WordPress dependencies
 */
import { useCallback, useEffect, useRef } from '@wordpress/element';
import { useThrottle } from '@wordpress/compose';

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
	scrollViewStyle,
	...props
} ) => {
	const scrollViewRef = useRef();
	const scrollViewMeasurements = useRef();
	const scrollViewYOffset = useSharedValue( -1 );

	const { height: windowHeight, width: windowWidth } = useWindowDimensions();
	const isLandscape = windowWidth >= windowHeight;

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
		scrollViewMeasurements,
		scrollViewRef,
		scrollViewYOffset
	);

	const onScrollToTextInput = useThrottle(
		useCallback(
			async ( caret ) => {
				const textInputOffset = await getTextInputOffset( caret );
				const isKeyboardVisibleWithOffset =
					isKeyboardVisible && keyboardOffset !== 0;
				const hasTextInputOffset = textInputOffset !== null;

				if (
					( isKeyboardVisibleWithOffset && hasTextInputOffset ) ||
					( ! isKeyboardVisible && hasTextInputOffset )
				) {
					scrollToTextInputOffset( caret, textInputOffset );
				}
			},
			[
				getTextInputOffset,
				isKeyboardVisible,
				keyboardOffset,
				scrollToTextInputOffset,
			]
		),
		200,
		{ leading: false }
	);

	useEffect( () => {
		onScrollToTextInput( currentCaretData );
	}, [ currentCaretData, onScrollToTextInput ] );

	// When the orientation changes, the ScrollView measurements
	// need to be re-calculated.
	useEffect( () => {
		// Only re-caculate them if there's an existing value
		// as it should be set when the ScrollView content changes.
		if ( scrollViewMeasurements.current ) {
			measureScrollView();
		}
	}, [ isLandscape, measureScrollView ] );

	const scrollHandler = useAnimatedScrollHandler( {
		onScroll: ( event ) => {
			const { contentOffset } = event;
			scrollViewYOffset.value = contentOffset.y;
			onScroll( event );
		},
	} );

	const measureScrollView = useCallback( () => {
		if ( scrollViewRef.current ) {
			const scrollRef = scrollViewRef.current.getNativeScrollRef();

			scrollRef.measureInWindow( ( _x, y, width, height ) => {
				scrollViewMeasurements.current = { y, width, height };
			} );
		}
	}, [] );

	const onContentSizeChange = useCallback( () => {
		onScrollToTextInput( currentCaretData );

		// Sets the first values when the content size changes.
		if ( ! scrollViewMeasurements.current ) {
			measureScrollView();
		}
	}, [ measureScrollView, onScrollToTextInput, currentCaretData ] );

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

	const style = [ { flex: 1 }, scrollViewStyle ];

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
			style={ style }
		>
			<FlatList { ...props } />
		</AnimatedScrollView>
	);
};

export default KeyboardAwareFlatList;
