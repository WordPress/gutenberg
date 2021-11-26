/**
 * External dependencies
 */
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { FlatList } from 'react-native';
import { isEqual } from 'lodash';

/**
 * WordPress dependencies
 */
import { memo } from '@wordpress/element';

const List = memo( FlatList, isEqual );

export const KeyboardAwareFlatList = ( {
	extraScrollHeight,
	shouldPreventAutomaticScroll,
	innerRef,
	autoScroll,
	scrollViewStyle,
	inputAccessoryViewHeight,
	...listProps
} ) => (
	<KeyboardAwareScrollView
		style={ [ { flex: 1 }, scrollViewStyle ] }
		keyboardDismissMode="none"
		enableResetScrollToCoords={ false }
		keyboardShouldPersistTaps="handled"
		extraScrollHeight={ extraScrollHeight }
		extraHeight={ 0 }
		inputAccessoryViewHeight={ inputAccessoryViewHeight }
		enableAutomaticScroll={ autoScroll === undefined ? false : autoScroll }
		ref={ ( ref ) => {
			this.scrollViewRef = ref;
			innerRef( ref );
		} }
		onKeyboardWillHide={ () => {
			this.keyboardWillShowIndicator = false;
		} }
		onKeyboardDidHide={ () => {
			setTimeout( () => {
				if (
					! this.keyboardWillShowIndicator &&
					this.latestContentOffsetY !== undefined &&
					! shouldPreventAutomaticScroll()
				) {
					// Reset the content position if keyboard is still closed.
					if ( this.scrollViewRef ) {
						this.scrollViewRef.scrollToPosition(
							0,
							this.latestContentOffsetY,
							true
						);
					}
				}
			}, 50 );
		} }
		onKeyboardWillShow={ () => {
			this.keyboardWillShowIndicator = true;
		} }
		scrollEnabled={ listProps.scrollEnabled }
		onScroll={ ( event ) => {
			this.latestContentOffsetY = event.nativeEvent.contentOffset.y;
		} }
	>
		<List { ...listProps } />
	</KeyboardAwareScrollView>
);

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
