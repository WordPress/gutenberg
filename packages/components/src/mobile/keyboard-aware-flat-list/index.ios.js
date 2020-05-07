/**
 * External dependencies
 */
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { FlatList } from 'react-native';
/**
 * WordPress dependencies
 */
import { Component } from '@wordpress/element';

class InnerFlatList extends Component {
	shouldComponentUpdate( nextProps ) {
		if (
			JSON.stringify( nextProps.data ) !==
				JSON.stringify( this.props.data ) ||
			JSON.stringify( nextProps.extraData ) !==
				JSON.stringify( this.props.extraData )
		) {
			return true;
		}
		return false;
	}
	render() {
		return <FlatList { ...this.props } />;
	}
}

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
		innerRef={ ( ref ) => {
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
					// Reset the content position if keyboard is still closed
					if ( this.scrollViewRef ) {
						this.scrollViewRef.props.scrollToPosition(
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
		<InnerFlatList { ...listProps } />
	</KeyboardAwareScrollView>
);

KeyboardAwareFlatList.handleCaretVerticalPositionChange = (
	scrollView,
	targetId,
	caretY,
	previousCaretY
) => {
	if ( previousCaretY ) {
		//if this is not the first tap
		scrollView.props.refreshScrollForField( targetId );
	}
};

export default KeyboardAwareFlatList;
