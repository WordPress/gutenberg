/**
 * @format
 * @flow
 */

import React from 'react';
import { Platform, TextInput, KeyboardAvoidingView } from 'react-native';
import styles from './html-text-input.scss';

// Gutenberg imports
import { serialize } from '@wordpress/blocks';

type PropsType = {
	blocks: Array<Object>,
	parseBlocksAction: string => mixed,
};

type StateType = {
	html: string,
};

export default class HTMLInputView extends React.Component<PropsType, StateType> {
	state = {
		html: '',
	}
	isIOS: boolean = Platform.OS === 'ios';
	textInput: TextInput;

	componentDidMount() {
		const html = this.serializeBlocksToHtml();
		this.setState( { html } );
		if ( this.isIOS ) {
			this.textInput.setNativeProps( { text: html } );
		}
	}

	componentWillUnmount() {
		//TODO: Blocking main thread
		this.props.parseBlocksAction( this.state.html );
	}

	shouldComponentUpdate() {
		return ! this.isIOS;
	}

	serializeBlocksToHtml() {
		return this.props.blocks
			.map( this.serializeBlock )
			.join( '' );
	}

	serializeBlock( block: Object ) {
		if ( block.name === 'aztec' ) {
			return '<aztec>' + block.attributes.content + '</aztec>\n\n';
		}

		return serialize( [ block ] ) + '\n\n';
	}

	render() {
		const behavior = this.isIOS ? 'padding' : null;

		return (
			<KeyboardAvoidingView style={ styles.container } behavior={ behavior }>
				<TextInput
					ref={ ( textInput ) => this.textInput = textInput }
					textAlignVertical="top"
					multiline
					numberOfLines={ 0 }
					style={ styles.htmlView }
					value={ this.isIOS ? null : this.state.html }
					onChangeText={ ( html ) => this.setState( { html } ) }
				/>
			</KeyboardAvoidingView>
		);
	}
}
