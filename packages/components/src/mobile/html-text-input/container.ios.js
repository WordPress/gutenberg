/**
 * External dependencies
 */
import { UIManager, PanResponder } from 'react-native';

/**
 * WordPress dependencies
 */
import { Component } from '@wordpress/element';

/**
 * Internal dependencies
 */
import KeyboardAvoidingView from '../keyboard-avoiding-view';
import styles from './style.ios.scss';

class HTMLInputContainer extends Component {
	constructor() {
		super( ...arguments );

		this.panResponder = PanResponder.create( {
			onStartShouldSetPanResponderCapture: () => true,

			onPanResponderMove: ( e, gestureState ) => {
				if ( gestureState.dy > 100 && gestureState.dy < 110 ) {
					// Keyboard.dismiss() and this.textInput.blur() are not working here
					// They require to know the currentlyFocusedID under the hood but
					// during this gesture there's no currentlyFocusedID.
					UIManager.blur( e.target );
				}
			},
		} );
	}

	render() {
		return (
			<KeyboardAvoidingView
				style={ styles.keyboardAvoidingView }
				{ ...this.panResponder.panHandlers }
				parentHeight={ this.props.parentHeight }
			>
				{ this.props.children }
			</KeyboardAvoidingView>
		);
	}
}

HTMLInputContainer.scrollEnabled = true;

export default HTMLInputContainer;
