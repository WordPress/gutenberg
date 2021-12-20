/**
 * External dependencies
 */
import { Pressable, Text } from 'react-native';

/**
 * WordPress dependencies
 */
import { usePreferredColorSchemeStyle } from '@wordpress/compose';

/**
 * Internal dependencies
 */
import styles from './style.scss';

const HelpGetSupportButton = ( { onPress, title } ) => {
	const buttonStyle = usePreferredColorSchemeStyle(
		styles.button,
		styles.buttonDark
	);

	const textStyle = usePreferredColorSchemeStyle(
		styles.buttonText,
		styles.buttonTextDark
	);

	return (
		<Pressable
			style={ buttonStyle }
			onPress={ onPress }
			accessibilityRole={ 'button' }
		>
			<Text style={ textStyle }>{ title }</Text>
		</Pressable>
	);
};

export default HelpGetSupportButton;
