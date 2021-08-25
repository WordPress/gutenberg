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

function Title( { children } ) {
	const titleStyle = usePreferredColorSchemeStyle(
		styles.title,
		styles[ 'title-dark' ]
	);

	return (
		<Text
			accessibilityRole="header"
			style={ titleStyle }
			maxFontSizeMultiplier={ 3 }
		>
			{ children }
		</Text>
	);
}

export default Title;
