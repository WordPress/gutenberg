/**
 * External dependencies
 */
import { Text } from 'react-native';

/**
 * WordPress dependencies
 */
import { usePreferredColorSchemeStyle } from '@wordpress/compose';

/**
 * Internal dependencies
 */
import styles from './styles.scss';

function Heading( { children } ) {
	const headingStyle = usePreferredColorSchemeStyle(
		styles.heading,
		styles[ 'heading-dark' ]
	);

	return (
		<Text
			accessibilityRole="header"
			style={ headingStyle }
			maxFontSizeMultiplier={ 3 }
		>
			{ children }
		</Text>
	);
}

export default Heading;
