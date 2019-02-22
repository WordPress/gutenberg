/**
 * @format
 * @flow
 */

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

import React from 'react';
import { Platform, TextInput, ScrollView } from 'react-native';
import styles from './html-text-input.scss';
import KeyboardAvoidingView from './keyboard-avoiding-view';

// Gutenberg imports
import { parse } from '@wordpress/blocks';
import { withDispatch, withSelect } from '@wordpress/data';
import { withInstanceId, compose } from '@wordpress/compose';

type PropsType = {
	onChange: string => mixed,
	onPersist: string => mixed,
	setTitleAction: string => void,
	value: string,
	title: string,
	parentHeight: number,
};

type StateType = {
	isDirty: boolean,
	value: string,
	contentHeight: number,
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
			isDirty: false,
			value: '',
			contentHeight: 0,
		};
	}

	static getDerivedStateFromProps( props: PropsType, state: StateType ) {
		if ( state.isDirty ) {
			return null;
		}

		return {
			value: props.value,
			isDirty: false,
		};
	}

	componentWillUnmount() {
		//TODO: Blocking main thread
		this.stopEditing();
	}

	edit( html: string ) {
		this.props.onChange( html );
		this.setState( { value: html, isDirty: true } );
	}

	stopEditing() {
		if ( this.state.isDirty ) {
			this.props.onPersist( this.state.value );
			this.setState( { isDirty: false } );
		}
	}

	render() {
		return (
			<KeyboardAvoidingView style={ styles.container } parentHeight={ this.props.parentHeight }>
				<ScrollView style={ { flex: 1 } } >
					<TextInput
						autoCorrect={ false }
						textAlignVertical="center"
						numberOfLines={ 1 }
						style={ styles.htmlViewTitle }
						value={ this.props.title }
						placeholder={ __( 'Add title' ) }
						onChangeText={ this.props.setTitleAction }
					/>
					<TextInput
						autoCorrect={ false }
						ref={ ( textInput ) => this.textInput = textInput }
						textAlignVertical="top"
						multiline
						style={ { ...styles.htmlView, height: this.state.contentHeight + 16 } }
						value={ this.state.value }
						onChangeText={ this.edit }
						onBlur={ this.stopEditing }
						placeholder={ __( 'Start writing…' ) }
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

export default compose( [
	withSelect( ( select ) => {
		const {
			getEditedPostContent,
		} = select( 'core/editor' );

		return {
			value: getEditedPostContent(),
		};
	} ),
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
