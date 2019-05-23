/**
 * External dependencies
 */
import { TouchableOpacity, View, Text } from 'react-native';

/**
 * Internal dependencies
 */
import styles from './styles.scss';

const BottomSheetButton = ( {
	onPress,
	disabled,
	text,
	color,
} ) => (
	<TouchableOpacity
		accessible={ true }
		onPress={ onPress }
		disabled={ disabled }
	>
		<View style={ { flexDirection: 'row', justifyContent: 'center' } }>
			<Text style={ { ...styles.buttonText, color } }>
				{ text }
			</Text>
		</View>
	</TouchableOpacity>
);

export default BottomSheetButton;
