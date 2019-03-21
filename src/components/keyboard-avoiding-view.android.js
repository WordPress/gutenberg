/**
* @format
* @flow
*/

/**
 * External dependencies
 */
import React from 'react';
import { View, KeyboardAvoidingView as AndroidKeyboardAvoidingView } from 'react-native';

type PropsType = {
	...View.propTypes,
	parentHeight: number;
}

const KeyboardAvoidingView = ( propsType: PropsType ) => {
	const { ...props } = propsType;

	return (
		<AndroidKeyboardAvoidingView { ...props } />
	);
};

export default KeyboardAvoidingView;
