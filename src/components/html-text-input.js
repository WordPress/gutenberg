
import React from 'react';
import { Platform, Switch, Text, View, FlatList, TextInput, KeyboardAvoidingView } from 'react-native';
import styles from './html-text-input.scss';

type BlockListType = {
	onChange: ( html: string ) => void,
	value: string,
};

export default class HTMLInputView extends React.Component<BlockListType> {
	_htmlTextInput: TextInput = null;

	constructor( props: PropsType ) {
		super( props );
	}

	shouldComponentUpdate() {
		return Platform.OS === 'android';
	}

	render() {
		console.log("Rendering text");
		const behavior = Platform.OS === 'ios' ? 'padding' : null;
		const htmlInputRef = ( el ) => this._htmlTextInput = el;

		return (
			<KeyboardAvoidingView style={ { flex: 1 } } behavior={ behavior }>
				<TextInput
					textAlignVertical="top"
					multiline
					ref={ htmlInputRef }
					numberOfLines={ 0 }
					style={ styles.htmlView }
					value={ this.props.value }
					onChangeText={ this.props.onChange } 
				/>
			</KeyboardAvoidingView>
		);
	}
}
