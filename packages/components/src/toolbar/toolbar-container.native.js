/**
 * External dependencies
 */
import { View } from 'react-native';

import styles from './style.scss';

const ToolbarContainer = ( props ) => (
	<View style={ [ styles.container, props.passedStyle ] }>
		{ props.children }
	</View>
);

export default ToolbarContainer;
