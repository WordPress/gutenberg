/**
 * External dependencies
 */
import { View } from 'react-native';

/**
 * Internal dependencies
 */
import styles from './style.scss';

const AccessibleToolbar = ( props ) => (
	<View style={ [ styles.container, props.passedStyle ] }>
		{ props.children }
	</View>
);

export default AccessibleToolbar;
