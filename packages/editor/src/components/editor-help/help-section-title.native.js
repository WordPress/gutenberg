/**
 * External dependencies
 */
import { Text, View } from 'react-native';

/**
 * WordPress dependencies
 */
import { usePreferredColorSchemeStyle } from '@wordpress/compose';

/**
 * Internal dependencies
 */
import styles from './style.scss';

const HelpSectionTitle = ( { children } ) => {
	const helpSectionTitle = usePreferredColorSchemeStyle(
		styles.helpSectionTitle,
		styles.helpSectionTitleDark
	);

	return (
		<View style={ styles.helpSectionTitleContainer }>
			<Text style={ helpSectionTitle }>{ children }</Text>
		</View>
	);
};

export default HelpSectionTitle;
