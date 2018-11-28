/**
 * @format
 * @flow
 */

import React from 'react';
import { Platform, TextInput, KeyboardAvoidingView } from 'react-native';
import styles from './html-text-input.scss';

// Gutenberg imports
import { serialize, parse } from '@wordpress/blocks';
import { withDispatch } from '@wordpress/data';
import { withInstanceId, compose } from '@wordpress/compose';

type PropsType = {
	blocks: Array<Object>,
	onChange: string => mixed,
	onPersist: string => mixed,
};

type StateType = {
	html: string,
	isDirty: boolean,
};

export class HTMLInputView extends React.Component<PropsType, StateType> {
	isIOS: boolean = Platform.OS === 'ios';
	textInput: TextInput;
	edit: string => mixed;
	stopEditing: () => mixed;

	constructor() {
		super( ...arguments );

		this.edit = this.edit.bind( this );
		this.stopEditing = this.stopEditing.bind( this );

		this.state = {
			html: '',
			isDirty: false,
		};
	}

	componentDidMount() {
		const html = this.serializeBlocksToHtml();
		this.setState( { html } );
		if ( this.isIOS ) {
			this.textInput.setNativeProps( { text: html } );
		}
	}

	componentWillUnmount() {
		//TODO: Blocking main thread
		this.stopEditing();
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

	edit( html: string ) {
		this.props.onChange( html );
		this.setState( { html, isDirty: true } );
	}

	stopEditing() {
		if ( this.state.isDirty ) {
			this.props.onPersist( this.state.html );
			this.setState( { isDirty: false } );
		}
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
					onChangeText={ this.edit }
					onBlur={ this.stopEditing }
				/>
			</KeyboardAvoidingView>
		);
	}
}

export default compose( [
	withDispatch( ( dispatch ) => {
		const { editPost, resetBlocks } = dispatch( 'core/editor' );
		return {
			onChange( content ) {
				editPost( { content } );
			},
			onPersist( content ) {
				resetBlocks( parse( content ) );
			},
		};
	} ),
	withInstanceId,
] )( HTMLInputView );
