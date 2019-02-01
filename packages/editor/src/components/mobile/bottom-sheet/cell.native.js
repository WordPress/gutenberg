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
		labelStyle = {},
		valueStyle = {},
	} = props;

	const defaultLabelStyle = value ? styles.cellLabel : styles.cellLabelCentered;

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
					<Text style={ { ...defaultLabelStyle, ...labelStyle } }>{ label }</Text>
				</View>
				{ value && (
					<Text style={ { ...styles.cellValue, ...valueStyle } }>{ value }</Text>
				) }
			</View>
			{ drawSeparator && (
				<View style={ styles.separator } />
			)}
		</TouchableOpacity>
	);
}
