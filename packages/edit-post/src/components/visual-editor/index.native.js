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
		this.keyboardDidShow = this.keyboardDidShow.bind( this );
		this.keyboardDidHide = this.keyboardDidHide.bind( this );

		this.state = {
			shouldEnableAutoScroll: true,
		};
	}

	componentWillMount() {
		this.keyboardDidShow = Keyboard.addListener(
			'keyboardDidShow',
			this.keyboardDidShow
		);
		this.keyboardDidHideListener = Keyboard.addListener(
			'keyboardDidHide',
			this.keyboardDidHide
		);
	}

	componentWillUnmount() {
		this.keyboardDidShow.remove();
		this.keyboardDidHideListener.remove();
	}

	keyboardDidShow() {
		this.setState( { shouldEnableAutoScroll: false } );
	}

	keyboardDidHide() {
		this.setState( { shouldEnableAutoScroll: true } );
	}

	renderHeader() {
		const { setTitleRef } = this.props;
		return <Header setTitleRef={ setTitleRef } />;
	}

	render() {
		const { safeAreaBottomInset } = this.props;
		const { shouldEnableAutoScroll } = this.state;

		return (
			<BlockList
				header={ this.renderHeader }
				safeAreaBottomInset={ safeAreaBottomInset }
				autoScroll={ shouldEnableAutoScroll }
			/>
		);
	}
}
