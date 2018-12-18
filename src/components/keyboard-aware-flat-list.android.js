/**
* @format
* @flow
*/
import { FlatList, KeyboardAvoidingView } from 'react-native';

type PropsType = {
	...FlatList.propTypes,
	shouldPreventAutomaticScroll: void => boolean,
	parentHeight: number,
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
