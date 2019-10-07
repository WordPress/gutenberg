/**
 * External dependencies
 */
import { View, TouchableWithoutFeedback } from 'react-native';

/**
 * Internal dependencies
 */
import styles from './block-mobile-floating-toolbar.scss';

function FloatingToolbar( { children, adjustVerticalPosition = 0 } ) {
	const top = adjustVerticalPosition !== 0 ? styles.floatingToolbar.top + adjustVerticalPosition : styles.floatingToolbar.top;
	return (
		<TouchableWithoutFeedback>
			<View style={ [ styles.floatingToolbar, { top } ] }>
				{ children }
			</View>
		</TouchableWithoutFeedback>
	);
}

export default FloatingToolbar;
