/**
 * External dependencies
 */
import { Keyboard } from 'react-native';

/**
 * WordPress dependencies
 */
import { useEffect, useState } from '@wordpress/element';
import '@wordpress/interface';

/**
 * Internal dependencies
 */
import HeaderToolbar from './header-toolbar';

const Header = () => {
	const [ isKeyboardVisible, setKeyboardVisible ] = useState( false );

	const keyboardDidShow = () => {
		setKeyboardVisible( true );
	};

	const keyboardDidHide = () => {
		setKeyboardVisible( false );
	};

	useEffect( () => {
		const keyboardShowSubscription = Keyboard.addListener(
			'keyboardDidShow',
			keyboardDidShow
		);
		const keyboardHideSubscription = Keyboard.addListener(
			'keyboardDidHide',
			keyboardDidHide
		);

		return () => {
			keyboardShowSubscription.remove();
			keyboardHideSubscription.remove();
		};
	}, [] );

	return <HeaderToolbar showKeyboardHideButton={ isKeyboardVisible } />;
};

export default Header;
