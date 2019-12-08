/**
 * External dependencies
 */
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { FlatList } from 'react-native';

export const KeyboardAwareFlatList = ( {
	innerRef,
	...listProps
} ) => (
	<KeyboardAwareScrollView
		style={ { flex: 1 } }
		//On Android we only use KeyboardAwareScrollView for it's scrollIntoView method
		enableOnAndroid={ false }
		innerRef={ innerRef }
	>
		<FlatList { ...listProps } />
	</KeyboardAwareScrollView>
);

KeyboardAwareFlatList.handleCaretVerticalPositionChange = () => {
	//no need to handle on Android, it is system managed
};

export default KeyboardAwareFlatList;
