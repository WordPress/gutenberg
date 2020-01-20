/**
 * External dependencies
 */
import { FlatList } from 'react-native';

/**
 * Internal dependencies
 */
import KeyboardAvoidingView from '../keyboard-avoiding-view';

export const KeyboardAwareFlatList = ( { containerStyle, ...props } ) => (
	<KeyboardAvoidingView style={ { flex: 1 } }>
		<FlatList style={ containerStyle ? containerStyle : undefined } { ...props } />
	</KeyboardAvoidingView>
);

KeyboardAwareFlatList.handleCaretVerticalPositionChange = () => {
	//no need to handle on Android, it is system managed
};

export default KeyboardAwareFlatList;
