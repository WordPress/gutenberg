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
	justifyContent,
} ) => (
	<TouchableOpacity
		accessible={ true }
		onPress={ onPress }
		disabled={ disabled }
	>
		<View
			style={ {
				flexDirection: 'row',
				justifyContent:
					justifyContent === undefined ? 'center' : justifyContent,
			} }
		>
			<Text style={ { ...styles.buttonText, color, paddingStart: 0 } }>
				{ text }
			</Text>
		</View>
	</TouchableOpacity>
);

export default BottomSheetButton;
