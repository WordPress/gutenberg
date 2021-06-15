/**
 * External dependencies
 */
import { Text, Linking } from 'react-native';
/**
 * WordPress dependencies
 */
import { withPreferredColorScheme } from '@wordpress/compose';
/**
 * Internal dependencies
 */
import styles from './styles.scss';

function FooterMessageLink( { href, value } ) {
	return (
		<Text
			style={ styles.footerMessageLink }
			onPress={ () => Linking.openURL( href ) }
		>
			{ value }
		</Text>
	);
}

export default withPreferredColorScheme( FooterMessageLink );
