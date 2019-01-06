/**
* @format
* @flow
*/
import { FlatList } from 'react-native';
import KeyboardAvoidingView from '../components/keyboard-avoiding-view';

type PropsType = {
	...FlatList.propTypes,
	shouldPreventAutomaticScroll: void => boolean,
	blockToolbarHeight: number,
	innerToolbarHeight: number,
}

const KeyboardAwareFlatList = ( props: PropsType ) => {
	return (
		<KeyboardAvoidingView style={ { flex: 1 } }>
			<FlatList { ...props } />
		</KeyboardAvoidingView>
	);
};

export default KeyboardAwareFlatList;
