/**
 * External dependencies
 */
import { KeyboardAvoidingView as IOSKeyboardAvoidingView, Dimensions } from 'react-native';

export const KeyboardAvoidingView = ( { parentHeight, ...otherProps } ) => {
	const { height: fullHeight } = Dimensions.get( 'window' );
	const keyboardVerticalOffset = fullHeight - parentHeight;

	return (
		<IOSKeyboardAvoidingView { ...otherProps } behavior="padding" keyboardVerticalOffset={ keyboardVerticalOffset } />
	);
};

export default KeyboardAvoidingView;
