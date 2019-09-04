/**
 * External dependencies
 */
import { View } from 'react-native';

/**
 * Internal dependencies
 */
import styles from './style.scss';
import { withTheme } from '../mobile/dark-mode';

const ToolbarContainer = ( { useStyle, passedStyle, children } ) => (
	<View style={ [ useStyle( styles.container, styles.containerDark ), passedStyle ] }>
		{ children }
	</View>
);

export default withTheme( ToolbarContainer );
