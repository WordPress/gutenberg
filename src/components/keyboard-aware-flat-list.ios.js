/**
* @format
* @flow
*/
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import React from 'react';
import { FlatList, Dimensions } from 'react-native';

type PropsType = {
	...FlatList.propTypes,
	shouldPreventAutomaticScroll: void => boolean,
	parentHeight: number,
	blockToolbarHeight: number,
	innerToolbarHeight: number,
}

const KeyboardAwareFlatList = ( props: PropsType ) => {
	const {
		parentHeight,
		blockToolbarHeight,
		innerToolbarHeight,
		shouldPreventAutomaticScroll,
		...listProps
	} = props;

	const extraScrollHeight = ( () => {
		const { height: fullHeight, width: fullWidth } = Dimensions.get( 'window' );
		const keyboardVerticalOffset = fullHeight - parentHeight;
		const blockHolderPadding = 8;

		if ( fullWidth > fullHeight ) { //landscape mode
			//we won't try to make inner block visible in landscape mode because there's not enough room for it
			return blockToolbarHeight + keyboardVerticalOffset;
		}
		//portrait mode
		return blockToolbarHeight + keyboardVerticalOffset + blockHolderPadding + innerToolbarHeight;
	} )();

	return (
		<KeyboardAwareScrollView
			style={ { flex: 1 } }
			keyboardDismissMode={ 'none' }
			enableResetScrollToCoords={ false }
			keyboardShouldPersistTaps={ 'handled' }
			extraScrollHeight={ extraScrollHeight }
			extraHeight={ 0 }
			innerRef={ ( ref ) => {
				( this: any ).scrollViewRef = ref;
			} }
			onKeyboardWillHide={ () => {
				( this: any ).keyboardWillShowIndicator = false;
			} }
			onKeyboardDidHide={ () => {
				setTimeout( () => {
					if ( ! ( this: any ).keyboardWillShowIndicator &&
						( this: any ).latestContentOffsetY !== undefined &&
						! shouldPreventAutomaticScroll() ) {
						// Reset the content position if keyboard is still closed
						( this: any ).scrollViewRef.props.scrollToPosition( 0, ( this: any ).latestContentOffsetY, true );
					}
				}, 50 );
			} }
			onKeyboardWillShow={ () => {
				( this: any ).keyboardWillShowIndicator = true;
			} }
			onScroll={ ( event: Object ) => {
				( this: any ).latestContentOffsetY = event.nativeEvent.contentOffset.y;
			} } >
			<FlatList { ...listProps } />
		</KeyboardAwareScrollView>
	);
};

export default KeyboardAwareFlatList;
