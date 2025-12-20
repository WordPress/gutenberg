/**
 * External dependencies
 */
import { View, TouchableWithoutFeedback } from 'react-native';

/**
 * Internal dependencies
 */
import styles from './styles.scss';

// Action button component is used by both Back and Apply Button components.
function ActionButton( {
	onPress,
	accessibilityLabel,
	accessibilityHint,
	children,
} ) {
	return (
		<TouchableWithoutFeedback
			onPress={ onPress }
			accessibilityRole="button"
			accessibilityLabel={ accessibilityLabel }
			accessibilityHint={ accessibilityHint }
		>
			<View style={ styles[ 'action-button' ] }>{ children }</View>
		</TouchableWithoutFeedback>
	);
}

export default ActionButton;
