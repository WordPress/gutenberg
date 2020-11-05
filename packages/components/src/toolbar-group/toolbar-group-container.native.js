/**
 * External dependencies
 */
import { View } from 'react-native';

/**
 * WordPress dependencies
 */
import { withPreferredColorScheme } from '@wordpress/compose';

/**
 * Internal dependencies
 */
import styles from './style.scss';

const ToolbarGroupContainer = ( {
	getStylesFromColorScheme,
	passedStyle,
	children,
} ) => (
	<View
		style={ [
			getStylesFromColorScheme( styles.container, styles.containerDark ),
			passedStyle,
		] }
	>
		{ children }
	</View>
);

export default withPreferredColorScheme( ToolbarGroupContainer );
