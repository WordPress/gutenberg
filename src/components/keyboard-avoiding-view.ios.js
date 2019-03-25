/**
* @format
* @flow
*/

/**
 * External dependencies
 */
import React from 'react';
import { View, KeyboardAvoidingView as IOSKeyboardAvoidingView, Dimensions } from 'react-native';

type PropsType = {
	...View.propTypes,
	parentHeight: number;
}

const KeyboardAvoidingView = ( propsType: PropsType ) => {
	const { parentHeight, ...props } = propsType;
	const { height: fullHeight } = Dimensions.get( 'window' );
	const keyboardVerticalOffset = fullHeight - parentHeight;

	return (
		<IOSKeyboardAvoidingView { ...props } behavior={ 'padding' } keyboardVerticalOffset={ keyboardVerticalOffset } />
	);
};

export default KeyboardAvoidingView;
