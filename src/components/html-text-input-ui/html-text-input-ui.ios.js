/**
 * @format
 * @flow
 */

/**
 * External dependencies
 */
import React from 'react';
import { TextInput, UIManager, PanResponder } from 'react-native';

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
};

export default class HTMLInputViewUI extends React.Component<PropsType, StateType> {
	panResponder: PanResponder;

	constructor() {
		super( ...arguments );

		this.panResponder = PanResponder.create( {
			onStartShouldSetPanResponderCapture: ( ) => true,

			onPanResponderMove: ( e, gestureState ) => {
				if ( gestureState.dy > 100 && gestureState.dy < 110 ) {
					//Keyboard.dismiss() and this.textInput.blur() is not working here
					//They require to know the currentlyFocusedID under the hood but
					//during this gesture there's no currentlyFocusedID
					UIManager.blur( e.target );
				}
			},
		} );
	}

	render() {
		return (
			<KeyboardAvoidingView
				style={ styles.container }
				{ ...this.panResponder.panHandlers }
				parentHeight={ this.props.parentHeight }>
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
					style={ { ...styles.htmlView } }
					value={ this.props.value }
					onChangeText={ this.props.onChangeHTMLText }
					onBlur={ this.props.onBlurHTMLText }
					placeholder={ this.props.htmlPlaceholder }
				/>
			</KeyboardAvoidingView>
		);
	}
}
