/**
* @format
* @flow
*/

import { KeyboardAvoidingView as AndroidKeyboardAvoidingView } from 'react-native';

const KeyboardAvoidingView = ( props ) => {
	return (
		<AndroidKeyboardAvoidingView { ...props } />
	);
};

export default KeyboardAvoidingView;
