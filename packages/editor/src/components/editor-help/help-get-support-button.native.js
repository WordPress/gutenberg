/**
 * External dependencies
 */
import { Pressable, Text } from 'react-native';

/**
 * WordPress dependencies
 */
import { requestCustomerSupportOptionsShow } from '@wordpress/react-native-bridge';
import { usePreferredColorSchemeStyle } from '@wordpress/compose';

/**
 * Internal dependencies
 */
import styles from './style.scss';

const HelpGetSupportButton = ( { title } ) => {
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
			onPress={ requestCustomerSupportOptionsShow }
		>
			{ /* todo: a11y */ }
			<Text style={ textStyle }>{ title }</Text>
		</Pressable>
	);
};

export default HelpGetSupportButton;
