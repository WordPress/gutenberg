/**
 * External dependencies
 */
import { Text, Image } from 'react-native';

/**
 * Internal dependencies
 */
import styles from './style.scss';

export const HelpDetailBodyText = ( { text } ) => {
	return <Text style={ styles.helpDetailBody }>{ text }</Text>;
};

export const HelpDetailSectionHeadingText = ( { text } ) => {
	return (
		<Text
			accessibilityRole="header"
			style={ styles.helpDetailSectionHeading }
		>
			{ text }
		</Text>
	);
};

export const HelpDetailImage = ( props ) => {
	return <Image style={ styles.helpDetailImage } { ...props } />;
};
