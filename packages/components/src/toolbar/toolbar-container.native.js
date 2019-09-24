/**
 * External dependencies
 */
import { View } from 'react-native';

/**
 * Internal dependencies
 */
import styles from './style.scss';
import { withPreferredColorScheme } from '@wordpress/compose';

const ToolbarContainer = ( { getStylesFromColorScheme, passedStyle, children } ) => (
	<View style={ [ getStylesFromColorScheme( styles.container, styles.containerDark ), passedStyle ] }>
		{ children }
	</View>
);

export default withPreferredColorScheme( ToolbarContainer );
