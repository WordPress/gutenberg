/**
 * External dependencies
 */
import { Text, Image } from 'react-native';

/**
 * WordPress dependencies
 */
import {
	usePreferredColorScheme,
	usePreferredColorSchemeStyle,
} from '@wordpress/compose';

/**
 * Internal dependencies
 */
import styles from './style.scss';

export const HelpDetailBodyText = ( { text } ) => {
	const bodyStyle = usePreferredColorSchemeStyle(
		styles.helpDetailBody,
		styles.helpDetailBodyDark
	);
	return (
		<Text selectable style={ bodyStyle }>
			{ text }
		</Text>
	);
};

export const HelpDetailSectionHeadingText = ( { text } ) => {
	const headingStyle = usePreferredColorSchemeStyle(
		styles.helpDetailSectionHeading,
		styles.helpDetailSectionHeadingDark
	);
	return (
		<Text accessibilityRole="header" selectable style={ headingStyle }>
			{ text }
		</Text>
	);
};

export const HelpDetailImage = ( {
	accessible,
	accessibilityLabel,
	source,
	sourceDarkMode,
} ) => {
	const imageStyle = usePreferredColorSchemeStyle(
		styles.helpDetailImage,
		styles.helpDetailImageDark
	);
	const darkModeEnabled = usePreferredColorScheme() === 'dark';
	return (
		<Image
			accessible={ accessible }
			accessibilityLabel={ accessibilityLabel }
			source={
				darkModeEnabled && sourceDarkMode ? sourceDarkMode : source
			}
			style={ imageStyle }
		/>
	);
};
