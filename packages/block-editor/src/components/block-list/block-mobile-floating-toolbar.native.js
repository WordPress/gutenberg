/**
 * External dependencies
 */
import { View, TouchableWithoutFeedback } from 'react-native';

/**
 * Internal dependencies
 */
import styles from './block-mobile-floating-toolbar.scss';

function FloatingToolbar( { children, forChild } ) {
	return (
		<TouchableWithoutFeedback>
			<View style={ [ styles.floatingToolbarFill, forChild ? styles.withTop : {} ] }>
				{ children }
			</View>
		</TouchableWithoutFeedback>
	);
}

export default FloatingToolbar;
