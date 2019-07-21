/**
 * External dependencies
 */
import { Keyboard } from 'react-native';

/**
 * WordPress dependencies
 */
import { Component } from '@wordpress/element';

/**
 * Internal dependencies
 */
import HeaderToolbar from './header-toolbar';

export default class Header extends Component {
	constructor() {
		super( ...arguments );

		this.keyboardDidShow = this.keyboardDidShow.bind( this );
		this.keyboardDidHide = this.keyboardDidHide.bind( this );

		this.state = {
			isKeyboardVisible: false,
		};
	}

	componentDidMount() {
		Keyboard.addListener( 'keyboardDidShow', this.keyboardDidShow );
		Keyboard.addListener( 'keyboardDidHide', this.keyboardDidHide );
	}

	componentWillUnmount() {
		Keyboard.removeListener( 'keyboardDidShow', this.keyboardDidShow );
		Keyboard.removeListener( 'keyboardDidHide', this.keyboardDidHide );
	}

	keyboardDidShow() {
		this.setState( { isKeyboardVisible: true } );
	}

	keyboardDidHide() {
		this.setState( { isKeyboardVisible: false } );
	}

	render() {
		return (
			<HeaderToolbar showKeyboardHideButton={ this.state.isKeyboardVisible } />
		);
	}
}
