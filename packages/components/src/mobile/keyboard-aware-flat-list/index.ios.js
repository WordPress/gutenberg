/**
 * External dependencies
 */
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { FlatList } from 'react-native';

export const KeyboardAwareFlatList = ( {
	blockToolbarHeight,
	innerToolbarHeight,
	shouldPreventAutomaticScroll,
	innerRef,
	...listProps
} ) => (
	<KeyboardAwareScrollView
		style={ { flex: 1 } }
		keyboardDismissMode="none"
		enableResetScrollToCoords={ false }
		keyboardShouldPersistTaps="handled"
		extraScrollHeight={ innerToolbarHeight }
		extraBottomInset={ -listProps.safeAreaBottomInset }
		inputAccessoryViewHeight={ blockToolbarHeight }
		extraHeight={ 0 }
		innerRef={ ( ref ) => {
			this.scrollViewRef = ref;
			innerRef( ref );
		} }
		onKeyboardWillHide={ () => {
			this.keyboardWillShowIndicator = false;
		} }
		onKeyboardDidHide={ () => {
			setTimeout( () => {
				if ( ! this.keyboardWillShowIndicator &&
					this.latestContentOffsetY !== undefined &&
					! shouldPreventAutomaticScroll() ) {
					// Reset the content position if keyboard is still closed
					this.scrollViewRef.props.scrollToPosition( 0, this.latestContentOffsetY, true );
				}
			}, 50 );
		} }
		onKeyboardWillShow={ () => {
			this.keyboardWillShowIndicator = true;
		} }
		onScroll={ ( event ) => {
			this.latestContentOffsetY = event.nativeEvent.contentOffset.y;
		} } >
		<FlatList { ...listProps } />
	</KeyboardAwareScrollView>
);

KeyboardAwareFlatList.handleCaretVerticalPositionChange = ( scrollView, targetId, caretY, previousCaretY ) => {
	if ( previousCaretY ) { //if this is not the first tap
		scrollView.props.refreshScrollForField( targetId );
	}
};

export default KeyboardAwareFlatList;

