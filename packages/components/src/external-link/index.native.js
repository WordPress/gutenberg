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

	if ( typeof children !== 'string' ) {
		throw new Error(
			__(
				'The ExternalLink component only accepts a string as a child element. This is to ensure the element can be read by screen readers.'
			)
		);
	}

	return (
		<Text
			style={ externalLink }
			onPress={ () => Linking.openURL( href ) }
			accessibilityLabel={ children }
			accessibilityHint={ __( 'Opens link in a browser' ) }
			accessibilityRole={ 'link' }
		>
			{ children }
		</Text>
	);
}

export default ExternalLink;
