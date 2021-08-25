/**
 * External dependencies
 */
import { View } from 'react-native';

/**
 * Internal dependencies
 */
import styles from './styles.scss';
import Button from './back-button';
import ApplyButton from './apply-button';
import Title from './title';

function Header( { children } ) {
	return <View style={ styles.header }>{ children }</View>;
}

Header.ApplyButton = ApplyButton;
Header.BackButton = Button.Back;
Header.CancelButton = Button.Cancel;
Header.CloseButton = Button.Close;
Header.Title = Title;

export default Header;
