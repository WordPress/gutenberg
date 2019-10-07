/**
 * External dependencies
 */
import { View, TouchableWithoutFeedback } from 'react-native';

/**
 * Internal dependencies
 */
import styles from './block-mobile-floating-toolbar.scss';

function FloatingToolbar( { children } ) {
	return (
		<TouchableWithoutFeedback>
			<View
				style={ styles.floatingToolbarFill }
			>{ children }
			</View>
		</TouchableWithoutFeedback>
	);
}

export default FloatingToolbar;
