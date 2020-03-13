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
	...props
} ) => (
	<View
		style={ [
			getStylesFromColorScheme( styles.container, styles.containerDark ),
			passedStyle,
			! props.noLeftSeparator && styles.leftSeparator,
		] }
	>
		{ children }
	</View>
);

export default withPreferredColorScheme( ToolbarGroupContainer );
