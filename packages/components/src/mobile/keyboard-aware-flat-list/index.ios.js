/**
 * External dependencies
 */
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { FlatList } from 'react-native';
import fastDeepEqual from 'fast-deep-equal/es6';
import Animated, {
	useAnimatedScrollHandler,
	useSharedValue,
} from 'react-native-reanimated';

/**
 * WordPress dependencies
 */
import { memo, useCallback, useRef } from '@wordpress/element';

const List = memo( FlatList, fastDeepEqual );
const AnimatedKeyboardAwareScrollView = Animated.createAnimatedComponent(
	KeyboardAwareScrollView
);

export const KeyboardAwareFlatList = ( {
	extraScrollHeight,
	shouldPreventAutomaticScroll,
	innerRef,
	autoScroll,
	scrollViewStyle,
	inputAccessoryViewHeight,
	onScroll,
	...listProps
} ) => {
	const scrollViewRef = useRef();
	const keyboardWillShowIndicator = useRef();

	const latestContentOffsetY = useSharedValue( -1 );

	const scrollHandler = useAnimatedScrollHandler( {
		onScroll: ( event ) => {
			const { contentOffset } = event;
			latestContentOffsetY.value = contentOffset.y;
			onScroll( event );
		},
	} );

	const getRef = useCallback(
		( ref ) => {
			scrollViewRef.current = ref;
			innerRef( ref );
		},
		[ innerRef ]
	);
	const onKeyboardWillHide = useCallback( () => {
		keyboardWillShowIndicator.current = false;
	}, [] );
	const onKeyboardDidHide = useCallback( () => {
		setTimeout( () => {
			if (
				! keyboardWillShowIndicator.current &&
				latestContentOffsetY.value !== -1 &&
				! shouldPreventAutomaticScroll()
			) {
				// Reset the content position if keyboard is still closed.
				scrollViewRef.current?.scrollToPosition(
					0,
					latestContentOffsetY.value,
					true
				);
			}
		}, 50 );
	}, [ latestContentOffsetY, shouldPreventAutomaticScroll ] );
	const onKeyboardWillShow = useCallback( () => {
		keyboardWillShowIndicator.current = true;
	}, [] );

	return (
		<AnimatedKeyboardAwareScrollView
			style={ [ { flex: 1 }, scrollViewStyle ] }
			keyboardDismissMode="none"
			enableResetScrollToCoords={ false }
			keyboardShouldPersistTaps="handled"
			extraScrollHeight={ extraScrollHeight }
			extraHeight={ 0 }
			inputAccessoryViewHeight={ inputAccessoryViewHeight }
			enableAutomaticScroll={
				autoScroll === undefined ? false : autoScroll
			}
			ref={ getRef }
			onKeyboardWillHide={ onKeyboardWillHide }
			onKeyboardDidHide={ onKeyboardDidHide }
			onKeyboardWillShow={ onKeyboardWillShow }
			scrollEnabled={ listProps.scrollEnabled }
			onScroll={ scrollHandler }
		>
			<List { ...listProps } />
		</AnimatedKeyboardAwareScrollView>
	);
};

KeyboardAwareFlatList.handleCaretVerticalPositionChange = (
	scrollView,
	targetId,
	caretY,
	previousCaretY
) => {
	if ( previousCaretY ) {
		// If this is not the first tap.
		scrollView.refreshScrollForField( targetId );
	}
};

export default KeyboardAwareFlatList;
