/**
 * External dependencies
 */
import { Text, Image } from 'react-native';

/**
 * WordPress dependencies
 */
import { usePreferredColorSchemeStyle } from '@wordpress/compose';

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
} ) => {
	const imageStyle = usePreferredColorSchemeStyle(
		styles.helpDetailImage,
		styles.helpDetailImageDark
	);
	return (
		<Image
			accessible={ accessible }
			accessibilityLabel={ accessibilityLabel }
			source={ source }
			style={ imageStyle }
		/>
	);
};
