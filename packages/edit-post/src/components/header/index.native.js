/**
 * External dependencies
 */
import { Keyboard } from 'react-native';

/**
 * WordPress dependencies
 */
import { Component } from '@wordpress/element';
import '@wordpress/interface';

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
		this.keyboardShowSubscription = Keyboard.addListener(
			'keyboardDidShow',
			this.keyboardDidShow
		);
		this.keyboardHideSubscription = Keyboard.addListener(
			'keyboardDidHide',
			this.keyboardDidHide
		);
	}

	componentWillUnmount() {
		this.keyboardShowSubscription.remove();
		this.keyboardHideSubscription.remove();
	}

	keyboardDidShow() {
		this.setState( { isKeyboardVisible: true } );
	}

	keyboardDidHide() {
		this.setState( { isKeyboardVisible: false } );
	}

	render() {
		return (
			<HeaderToolbar
				showKeyboardHideButton={ this.state.isKeyboardVisible }
			/>
		);
	}
}
