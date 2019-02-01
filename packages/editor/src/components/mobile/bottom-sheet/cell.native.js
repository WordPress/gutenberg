/**
* External dependencies
*/
import { TouchableOpacity, Text, View } from 'react-native';

import { Dashicon } from '@wordpress/components';

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
		icon,
	} = props;

	return (
		<TouchableOpacity onPress={ onPress }>
			<View style={ styles.cellContainer }>
				<View style={ { flexDirection: 'row', alignItems: 'center' } }>
					{ icon && (
						<View style={ { flexDirection: 'row', alignItems: 'center' } }>
							<Dashicon icon={ icon } size={ 30 } />
							<View style={ { width: 12 } }/>
						</View>
					) }
					<Text style={ value ? styles.cellLabel : styles.cellLabelCentered }>{ label }</Text>
				</View>
				{ value && (
					<Text style={ styles.cellValue }>{ value }</Text>
				) }
			</View>
			{ drawSeparator && (
				<View style={ styles.separator } />
			)}
		</TouchableOpacity>
	);
}
