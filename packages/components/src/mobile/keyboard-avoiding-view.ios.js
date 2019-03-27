/**
 * External dependencies
 */
import { KeyboardAvoidingView as IOSKeyboardAvoidingView, Dimensions } from 'react-native';

const KeyboardAvoidingView = ( props ) => {
	const { parentHeight, ...otherProps } = props;
	const { height: fullHeight } = Dimensions.get( 'window' );
	const keyboardVerticalOffset = fullHeight - parentHeight;

	return (
		<IOSKeyboardAvoidingView { ...otherProps } behavior={ 'padding' } keyboardVerticalOffset={ keyboardVerticalOffset } />
	);
};

export default KeyboardAvoidingView;
