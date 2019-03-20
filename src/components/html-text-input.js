/**
 * @format
 * @flow
 */

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

import React from 'react';
import { Platform, TextInput, UIManager, PanResponder } from 'react-native';
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
};

export class HTMLInputView extends React.Component<PropsType, StateType> {
	isIOS: boolean = Platform.OS === 'ios';
	edit: string => mixed;
	stopEditing: () => mixed;
	panResponder: PanResponder;

	constructor() {
		super( ...arguments );

		this.edit = this.edit.bind( this );
		this.stopEditing = this.stopEditing.bind( this );

		this.panResponder = PanResponder.create( {
			onStartShouldSetPanResponderCapture: ( ) => true,

			onPanResponderMove: ( e, gestureState ) => {
				if ( this.isIOS && ( gestureState.dy > 100 && gestureState.dy < 110 ) ) {
					//Keyboard.dismiss() and this.textInput.blur() is not working here
					//They require to know the currentlyFocusedID under the hood but
					//during this gesture there's no currentlyFocusedID
					UIManager.blur( e.target );
				}
			},
		} );

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
			<KeyboardAvoidingView
				style={ styles.container }
				{ ...( this.isIOS ? { ...this.panResponder.panHandlers } : {} ) }
				parentHeight={ this.props.parentHeight }>
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
					textAlignVertical="top"
					multiline
					style={ { ...styles.htmlView } }
					value={ this.state.value }
					onChangeText={ this.edit }
					onBlur={ this.stopEditing }
					placeholder={ __( 'Start writing…' ) }
				/>
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
		const { resetBlocks } = dispatch( 'core/block-editor' );
		const { editPost } = dispatch( 'core/editor' );
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
