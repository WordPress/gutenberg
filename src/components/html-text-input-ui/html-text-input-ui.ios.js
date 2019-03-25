/**
 * @format
 * @flow
 */

/**
 * External dependencies
 */
import * as React from 'react';
import { UIManager, PanResponder } from 'react-native';

/**
 * Internal dependencies
 */
import styles from './html-text-input-ui.scss';
import KeyboardAvoidingView from '../keyboard-avoiding-view';

type PropsType = {
	parentHeight: number,
	content: ( scrollEnabled: boolean, style: mixed, onContentSizeChange: () => void ) => React.Node,
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
				parentHeight={ this.props.parentHeight }
			>
				{ this.props.content( true, styles.htmlView, () => {} ) }

			</KeyboardAvoidingView>
		);
	}
}
