/**
 * External dependencies
 */
import { View } from 'react-native';

/**
 * Internal dependencies
 */
import styles from './style.scss';
import { withTheme, useStyle } from '../mobile/dark-mode';

const ToolbarContainer = ( props ) => (
	<View style={ [ useStyle( styles.container, styles.containerDark, props.theme ), props.passedStyle ] }>
		{ props.children }
	</View>
);

export default withTheme( ToolbarContainer );
