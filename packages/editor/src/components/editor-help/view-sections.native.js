/**
 * External dependencies
 */
import { Text, Image, View } from 'react-native';

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

export const HelpDetailSectionHeadingText = ( { text, badge } ) => {
	const headingTextStyle = usePreferredColorSchemeStyle(
		styles.helpDetailSectionHeadingText,
		styles.helpDetailSectionHeadingTextDark
	);
	return (
		<View style={ styles.helpDetailSectionHeading }>
			{ badge && <HelpDetailBadge text={ badge } /> }
			<Text
				accessibilityRole="header"
				selectable
				style={ headingTextStyle }
			>
				{ text }
			</Text>
		</View>
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

const HelpDetailBadge = ( { text } ) => {
	return (
		<View style={ styles.helpDetailBadgeContainer }>
			<Text style={ styles.helpDetailBadgeText }>{ text }</Text>
		</View>
	);
};
