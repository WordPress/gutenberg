/**
 * @format
 * @flow
 */

/**
 * External dependencies
 */
import React from 'react';
import { TextInput, ScrollView } from 'react-native';

/**
 * Internal dependencies
 */
import styles from './html-text-input-ui.scss';
import KeyboardAvoidingView from '../keyboard-avoiding-view';

type PropsType = {
    setTitleAction: string => void,
	value: string,
	title: string,
    parentHeight: number,
    onChangeHTMLText: string => mixed,
    onBlurHTMLText: () => mixed,
    titlePlaceholder: string,
    htmlPlaceholder: string,
};

type StateType = {
    contentHeight: number,
};

export default class HTMLInputViewUI extends React.Component<PropsType, StateType> {
	constructor() {
		super( ...arguments );

		this.state = {
			contentHeight: 0,
		};
	}

	render() {
		return (
			<KeyboardAvoidingView style={ styles.container } parentHeight={ this.props.parentHeight }>
				<ScrollView
					style={ { flex: 1 } }
					keyboardDismissMode="interactive" >
					<TextInput
						autoCorrect={ false }
						textAlignVertical="center"
						numberOfLines={ 1 }
						style={ styles.htmlViewTitle }
						value={ this.props.title }
						placeholder={ this.props.titlePlaceholder }
						onChangeText={ this.props.setTitleAction }
					/>
					<TextInput
						autoCorrect={ false }
						textAlignVertical="top"
						multiline
						style={ { ...styles.htmlView, height: this.state.contentHeight + 16 } }
						value={ this.props.value }
						onChangeText={ this.props.onChangeHTMLText }
						onBlur={ this.props.onBlurHTMLText }
						placeholder={ this.props.htmlPlaceholder }
						scrollEnabled={ false }
						onContentSizeChange={ ( event ) => {
							this.setState( { contentHeight: event.nativeEvent.contentSize.height } );
						} }
					/>
				</ScrollView>
			</KeyboardAvoidingView>
		);
	}
}
