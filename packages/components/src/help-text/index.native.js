/**
 * External dependencies
 */
import { View, Text, AccessibilityInfo, Linking } from 'react-native';

/**
 * WordPress dependencies
 */
import { ExternalLink } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { usePreferredColorSchemeStyle } from '@wordpress/compose';

/**
 * Internal dependencies
 */
import styles from './styles.scss';

const HelpText = ( { moreLinkText, children, url, separatorType } ) => {
	if ( typeof children === 'string' ) {
		children = (
			<Text style={ styles[ 'help-text__text' ] }>{ children }</Text>
		);
	}

	const separatorStyle = usePreferredColorSchemeStyle(
		styles[ 'help-text__separator' ],
		styles[ 'help-text__separator--dark' ]
	);

	const hasMoreLink = url && moreLinkText;

	return (
		<>
			{ separatorType === 'topFullWidth' && (
				<View style={ separatorStyle } />
			) }
			<View style={ styles[ 'help-text' ] }>
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
					style={ styles[ 'help-text__text' ] }
				>
					{ children }
					{ children && hasMoreLink && ' ' }
					{ hasMoreLink && (
						<ExternalLink href={ url }>
							{ moreLinkText }
						</ExternalLink>
					) }
				</Text>
			</View>
		</>
	);
};

export default HelpText;
