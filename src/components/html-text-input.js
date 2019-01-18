/**
 * @format
 * @flow
 */

import React from 'react';
import { Platform, TextInput, View } from 'react-native';
import styles from './html-text-input.scss';
import KeyboardAvoidingView from './keyboard-avoiding-view';

// Gutenberg imports
import { parse } from '@wordpress/blocks';
import { withDispatch, withSelect } from '@wordpress/data';
import { withInstanceId, compose } from '@wordpress/compose';

type PropsType = {
	onChange: string => mixed,
	onPersist: string => mixed,
	value: string,
	parentHeight: number,
};

type StateType = {
	isDirty: boolean,
	value: string,
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
				<View style={ { flex: 1 } } >
					<TextInput
						autoCorrect={ false }
						ref={ ( textInput ) => this.textInput = textInput }
						textAlignVertical="top"
						multiline
						numberOfLines={ 0 }
						style={ styles.htmlView }
						value={ this.state.value }
						onChangeText={ this.edit }
						onBlur={ this.stopEditing }
					/>
				</View>
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
