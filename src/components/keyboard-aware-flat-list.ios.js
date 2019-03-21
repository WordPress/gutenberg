/**
* @format
* @flow
*/

/**
 * External dependencies
 */
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import React from 'react';
import { FlatList } from 'react-native';

/**
 * Internal dependencies
 */
import styles from '../block-management/block-holder.scss';

type PropsType = {
	...FlatList.propTypes,
	shouldPreventAutomaticScroll: void => boolean,
	blockToolbarHeight: number,
	innerToolbarHeight: number,
	safeAreaBottomInset: number,
	innerRef?: Function,
}

export const KeyboardAwareFlatList = ( props: PropsType ) => {
	const {
		blockToolbarHeight,
		innerToolbarHeight,
		shouldPreventAutomaticScroll,
		innerRef,
		...listProps
	} = props;

	const extraScrollHeight = styles.blockContainerFocused.paddingBottom + innerToolbarHeight;

	return (
		<KeyboardAwareScrollView
			style={ { flex: 1 } }
			keyboardDismissMode={ 'none' }
			enableResetScrollToCoords={ false }
			keyboardShouldPersistTaps={ 'handled' }
			extraScrollHeight={ extraScrollHeight }
			extraBottomInset={ -props.safeAreaBottomInset }
			inputAccessoryViewHeight={ blockToolbarHeight }
			extraHeight={ 0 }
			innerRef={ ( ref ) => {
				( this: any ).scrollViewRef = ref;
				innerRef( ref );
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

export const handleCaretVerticalPositionChange = (
	scrollView: Object,
	targetId: number,
	caretY: number,
	previousCaretY: ?number ) => {
	if ( previousCaretY ) { //if this is not the first tap
		scrollView.props.refreshScrollForField( targetId );
	}
};

export default { KeyboardAwareFlatList, handleCaretVerticalPositionChange };
