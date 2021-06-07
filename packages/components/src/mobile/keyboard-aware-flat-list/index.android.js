/**
 * External dependencies
 */
import { Animated } from 'react-native';

/**
 * Internal dependencies
 */
import KeyboardAvoidingView from '../keyboard-avoiding-view';

export const KeyboardAwareFlatList = ( props ) => (
	<KeyboardAvoidingView style={ { flex: 1 } }>
		<Animated.FlatList { ...props } />
	</KeyboardAvoidingView>
);

KeyboardAwareFlatList.handleCaretVerticalPositionChange = () => {
	//no need to handle on Android, it is system managed
};

export default KeyboardAwareFlatList;
