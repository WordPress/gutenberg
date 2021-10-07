/**
 * External dependencies
 */
import { View } from 'react-native';

/**
 * Internal dependencies
 */
import ApplyButton from './apply-button';
import Button from './back-button';
import Heading from './heading';
import styles from './styles.scss';
function NavBar( { children } ) {
	return <View style={ styles[ 'nav-bar' ] }>{ children }</View>;
}

NavBar.ApplyButton = ApplyButton;
NavBar.BackButton = Button.Back;
NavBar.DismissButton = Button.Dismiss;

NavBar.Heading = Heading;

export default NavBar;
