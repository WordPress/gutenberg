/**
* External dependencies
*/
import { TouchableOpacity, Text, View } from 'react-native';

/**
 * Internal dependencies
 */
import styles from './styles.scss';

export default function Cell( props ) {
	const {
		onPress,
		label,
		value,
		drawSeparator = true,
	} = props;

	return (
		<TouchableOpacity onPress={ onPress }>
			<View style={ styles.cellContainer }>
				<Text style={ value ? styles.cellLabel : styles.cellLabelCentered }>{ label }</Text>
				{ value && (
					<Text style={ styles.cellValue }>{ value }</Text>
				)}
			</View>
			{ drawSeparator && (
				<View style={ styles.separator } />
			)}
		</TouchableOpacity>
	);
}
