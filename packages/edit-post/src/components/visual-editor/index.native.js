/**
 * WordPress dependencies
 */
import { Component } from '@wordpress/element';
import { BlockList } from '@wordpress/block-editor';
/**
 * External dependencies
 */
import { Keyboard } from 'react-native';
/**
 * Internal dependencies
 */
import Header from './header';

export default class VisualEditor extends Component {
	constructor( props ) {
		super( props );
		this.renderHeader = this.renderHeader.bind( this );
		this.keyboardWillShow = this.keyboardWillShow.bind( this );
		this.keyboardWillHide = this.keyboardWillHide.bind( this );

		this.state = {
			isKeyboardOpen: false,
		};
	}

	componentWillMount() {
		this.keyboardWillShowListener = Keyboard.addListener(
			'keyboardWillShow',
			this.keyboardWillShow
		);
		this.keyboardWillHideListener = Keyboard.addListener(
			'keyboardWillHide',
			this.keyboardWillHide
		);
	}

	componentWillUnmount() {
		this.keyboardWillShowListener.remove();
		this.keyboardWillHideListener.remove();
	}

	keyboardWillShow() {
		this.setState( { isKeyboardOpen: true } );
	}

	keyboardWillHide() {
		this.setState( { isKeyboardOpen: false } );
	}
	renderHeader() {
		const { setTitleRef } = this.props;
		return <Header setTitleRef={ setTitleRef } />;
	}
	render() {
		const { safeAreaBottomInset } = this.props;
		return (
			<BlockList
				header={ this.renderHeader }
				safeAreaBottomInset={ safeAreaBottomInset }
				autoScroll={ this.state.isKeyboardOpen }
			/>
		);
	}
}
