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

const ToolbarContainer = ( { useStyle, passedStyle, children, rtl = false } ) => (
	<View style={ [ useStyle( styles.container, styles.leftBorder, styles.containerDark ), passedStyle, rtl ? styles.rightBorder : styles.leftBorder] }>
		{ children }
	</View>
);

export default withPreferredColorScheme( ToolbarContainer );
