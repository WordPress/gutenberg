/**
* External dependencies
*/
import { TouchableOpacity, Text, View, TextInput } from 'react-native';

/**
 * WordPress dependencies
 */
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
		valuePlaceholder = '',
		drawSeparator = true,
		icon,
		labelStyle = {},
		valueStyle = {},
		onChangeValue,
		...valueProps
	} = props;

	const showValue = value !== undefined;
	const isValueEditable = onChangeValue !== undefined;
	const defaultLabelStyle = showValue ? styles.cellLabel : styles.cellLabelCentered;
	const separatorStyle = showValue ? styles.cellSeparator : styles.separator;
	let valueTextInput;

	const onCellPress = () => {
		if ( isValueEditable ) {
			valueTextInput.focus();
		} else if ( onPress !== undefined ) {
			onPress();
		}
	};

	return (
		<TouchableOpacity onPress={ onCellPress } >
			<View style={ styles.cellContainer }>
				<View style={ styles.cellRowContainer }>
					{ icon && (
						<View style={ styles.cellRowContainer }>
							<Dashicon icon={ icon } size={ 24 } />
							<View style={ { width: 12 } } />
						</View>
					) }
					<Text numberOfLines={ 1 } style={ { ...defaultLabelStyle, ...labelStyle } }>
						{ label }
					</Text>
				</View>
				{ showValue && (
					<TextInput
						ref={ ( c ) => valueTextInput = c }
						numberOfLines={ 1 }
						style={ { ...styles.cellValue, ...valueStyle } }
						value={ value }
						placeholder={ valuePlaceholder }
						placeholderTextColor={ '#87a6bc' }
						onChangeText={ onChangeValue }
						editable={ isValueEditable }
						{ ...valueProps }
					/>
				) }
			</View>
			{ drawSeparator && (
				<View style={ separatorStyle } />
			) }
		</TouchableOpacity>
	);
}
