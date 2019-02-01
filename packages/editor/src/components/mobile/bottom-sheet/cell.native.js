/**
* External dependencies
*/
import { TouchableOpacity, Text } from 'react-native';

/**
 * Internal dependencies
 */
import styles from './styles.scss';

export default function Cell( props ) {
	const {
		onPress,
		label,
		value,
	} = props;

	return (
		<TouchableOpacity style={ styles.cellContainer } onPress={ onPress }>
			<Text style={ styles.cellLabel }>{ label }</Text>
			<Text style={ styles.cellValue }>{ value }</Text>
		</TouchableOpacity>
	);
}
