/**
 * External dependencies
 */
import { View, Text, AccessibilityInfo, Linking } from 'react-native';

/**
 * WordPress dependencies
 */
import { ExternalLink } from '@wordpress/components';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import styles from './styles.scss';

const HelpText = ( { moreLinkText, children, url } ) => {
	if ( typeof children === 'string' ) {
		children = (
			<Text style={ styles[ 'help-text__text' ] }>{ children }</Text>
		);
	}
	return (
		<View>
			<Text
				accessibilityRole={ url ? 'link' : 'text' }
				accessibilityHint={
					url ? __( 'Opens link in a browser' ) : null
				}
				onPress={ () => {
					AccessibilityInfo.isScreenReaderEnabled().then(
						( enabled ) => enabled && Linking.openURL( url )
					);
				} }
				style={ styles[ 'help-text' ] }
			>
				{ children }
				{ children && url && ' ' }
				{ url && (
					<ExternalLink href={ url }>{ moreLinkText }</ExternalLink>
				) }
			</Text>
		</View>
	);
};

export default HelpText;
