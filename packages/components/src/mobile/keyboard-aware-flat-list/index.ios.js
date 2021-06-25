/**
 * External dependencies
 */
import { KeyboardAwareFlatList as RNKeyboardAwareFlatList } from 'react-native-keyboard-aware-scroll-view';

/**
 * WordPress dependencies
 */
import { useRef } from '@wordpress/element';

export const KeyboardAwareFlatList = ( {
	extraScrollHeight,
	shouldPreventAutomaticScroll,
	innerRef,
	autoScroll,
	scrollViewStyle,
	inputAccessoryViewHeight,
	scrollEnabled,
	...listProps
} ) => {
	const scrollViewRef = useRef();
	const keyboardWillShowIndicator = useRef();
	const latestContentOffsetY = useRef();
	return (
		<RNKeyboardAwareFlatList
			style={ [ { flex: 1 }, scrollViewStyle ] }
			contentContainerStyle={ { flexGrow: 1, backgroundColor: 'red' } }
			keyboardDismissMode="none"
			enableResetScrollToCoords={ false }
			keyboardShouldPersistTaps="handled"
			extraScrollHeight={ extraScrollHeight }
			extraHeight={ 0 }
			inputAccessoryViewHeight={ inputAccessoryViewHeight }
			enableAutomaticScroll={
				autoScroll === undefined ? false : autoScroll
			}
			ref={ ( ref ) => {
				scrollViewRef.current = ref;
				innerRef( ref );
			} }
			onKeyboardWillHide={ () => {
				keyboardWillShowIndicator.current = false;
			} }
			onKeyboardDidHide={ () => {
				setTimeout( () => {
					if (
						! keyboardWillShowIndicator.current &&
						latestContentOffsetY.current !== undefined &&
						! shouldPreventAutomaticScroll()
					) {
						// Reset the content position if keyboard is still closed
						if ( scrollViewRef.current ) {
							scrollViewRef.current.scrollToPosition(
								0,
								latestContentOffsetY.current,
								true
							);
						}
					}
				}, 50 );
			} }
			onKeyboardWillShow={ () => {
				keyboardWillShowIndicator.current = true;
			} }
			scrollEnabled={ scrollEnabled }
			onScroll={ ( event ) => {
				latestContentOffsetY.current =
					event.nativeEvent.contentOffset.y;
			} }
			{ ...listProps }
		/>
	);
};

KeyboardAwareFlatList.handleCaretVerticalPositionChange = (
	scrollView,
	targetId,
	caretY,
	previousCaretY
) => {
	if ( previousCaretY ) {
		//if this is not the first tap
		scrollView.refreshScrollForField( targetId );
	}
};

export default KeyboardAwareFlatList;
