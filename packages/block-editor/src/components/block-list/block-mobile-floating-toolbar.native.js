/**
 * External dependencies
 */
import { View, TouchableWithoutFeedback } from 'react-native';

/**
 * Internal dependencies
 */
import styles from './block-mobile-floating-toolbar.scss';

const FloatingToolbar = ( { children } ) => {
	return (
		<TouchableWithoutFeedback>
			<View style={ styles.floatingToolbar }>{ children }</View>
		</TouchableWithoutFeedback>
	);
};

export default FloatingToolbar;
