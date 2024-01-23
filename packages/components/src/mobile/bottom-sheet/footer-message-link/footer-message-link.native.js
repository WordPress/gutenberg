/**
 * External dependencies
 */
import { Text, Linking } from 'react-native';
/**
 * WordPress dependencies
 */
import { usePreferredColorSchemeStyle } from '@wordpress/compose';
/**
 * Internal dependencies
 */
import styles from './styles.scss';

function FooterMessageLink( { href, value } ) {
	const textStyle = usePreferredColorSchemeStyle(
		styles.footerMessageLink,
		styles.footerMessageLinkDark
	);
	return (
		<Text style={ textStyle } onPress={ () => Linking.openURL( href ) }>
			{ value }
		</Text>
	);
}

export default FooterMessageLink;
