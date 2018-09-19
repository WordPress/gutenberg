/**
 * @format
 * @flow
 */

import React from 'react';
import { Platform, TextInput, KeyboardAvoidingView } from 'react-native';
import styles from './html-text-input.scss';

type PropsType = {
	onChange: ( html: string ) => void,
	value: string,
};

export default class HTMLInputView extends React.Component<PropsType> {
	shouldComponentUpdate() {
		return Platform.OS === 'android';
	}

	render() {
		const behavior = Platform.OS === 'ios' ? 'padding' : null;

		return (
			<KeyboardAvoidingView style={ { flex: 1 } } behavior={ behavior }>
				<TextInput
					textAlignVertical="top"
					multiline
					numberOfLines={ 0 }
					style={ styles.htmlView }
					value={ this.props.value }
					onChangeText={ this.props.onChange }
				/>
			</KeyboardAvoidingView>
		);
	}
}
