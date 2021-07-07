/**
 * External dependencies
 */

import { Text, Linking } from 'react-native';

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { usePreferredColorSchemeStyle } from '@wordpress/compose';
/**
 * Internal dependencies
 */
import style from './style.native.scss';

export function ExternalLink( { href, children } ) {
	const externalLink = usePreferredColorSchemeStyle(
		style[ 'external-link' ],
		style[ 'external-link__dark' ]
	);

	return (
		<Text
			style={ externalLink }
			onPress={ () => Linking.openURL( href ) }
			accessibilityLabel={ __( 'Open link in a browser' ) }
		>
			{ children }
		</Text>
	);
}

export default ExternalLink;
