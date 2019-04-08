/**
 * External dependencies
 */
import { TouchableOpacity, View, Text } from 'react-native';

/**
 * Internal dependencies
 */
import styles from './styles.scss';

export default function Button( props ) {
	const {
		onPress,
		disabled,
		text,
		color,
	} = props;

	return (
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
}
