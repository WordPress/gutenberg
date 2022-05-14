/**
 * WordPress dependencies
 */
import { Component, Platform } from '@wordpress/element';
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
			isAutoScrollEnabled: true,
		};
	}

	componentDidMount() {
		if ( Platform.isIOS ) {
			this.keyboardDidShow = Keyboard.addListener(
				'keyboardDidShow',
				this.keyboardDidShow
			);
			this.keyboardDidHideListener = Keyboard.addListener(
				'keyboardDidHide',
				this.keyboardDidHide
			);
		}
	}

	componentWillUnmount() {
		if ( Platform.isIOS ) {
			this.keyboardDidShow.remove();
			this.keyboardDidHideListener.remove();
		}
	}

	keyboardDidShow() {
		if ( Platform.isIOS ) {
			this.setState( { isAutoScrollEnabled: false } );
		}
	}

	keyboardDidHide() {
		if ( Platform.isIOS ) {
			this.setState( { isAutoScrollEnabled: true } );
		}
	}

	renderHeader() {
		const { setTitleRef } = this.props;
		return <Header setTitleRef={ setTitleRef } />;
	}

	render() {
		const { safeAreaBottomInset } = this.props;

		// Not needed for autoscroll behavior on Android, so reduce rerenders
		// by keeping the passed prop constant on Android.
		const isAutoScrollEnabled = Platform.isIOS
			? this.state.isAutoScrollEnabled
			: undefined;

		return (
			<BlockList
				header={ this.renderHeader }
				safeAreaBottomInset={ safeAreaBottomInset }
				autoScroll={ isAutoScrollEnabled }
			/>
		);
	}
}
