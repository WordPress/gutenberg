/**
* @format
* @flow
*/

/**
 * External dependencies
 */
import { FlatList } from 'react-native';

/**
 * Internal dependencies
 */
import KeyboardAvoidingView from '../components/keyboard-avoiding-view';

type PropsType = {
	...FlatList.propTypes,
	shouldPreventAutomaticScroll: void => boolean,
	blockToolbarHeight: number,
	innerToolbarHeight: number,
	innerRef?: Function,
}

export const KeyboardAwareFlatList = ( props: PropsType ) => {
	return (
		<KeyboardAvoidingView style={ { flex: 1 } }>
			<FlatList { ...props } />
		</KeyboardAvoidingView>
	);
};

export const handleCaretVerticalPositionChange = () => {
	//no need to handle on Android, it is system managed
};

export default { KeyboardAwareFlatList, handleCaretVerticalPositionChange };
