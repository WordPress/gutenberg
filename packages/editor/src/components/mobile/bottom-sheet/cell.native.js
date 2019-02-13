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
		icon,
		labelStyle = {},
		valueStyle = {},
		onChangeValue,
		children,
		editable = true,
		separatorType,
		...valueProps
	} = props;

	const showValue = value !== undefined;
	const isValueEditable = editable && onChangeValue !== undefined;
	const defaultLabelStyle = showValue ? styles.cellLabel : styles.cellLabelCentered;
	const drawSeparator = separatorType && separatorType !== 'none' || separatorStyle === undefined; 
	let valueTextInput;

	const onCellPress = () => {
		if ( isValueEditable ) {
			valueTextInput.focus();
		} else if ( onPress !== undefined ) {
			onPress();
		}
	};

	const separatorStyle = () => {
		switch (separatorType) {
			case 'leftMargin':
				return styles.cellSeparator;
			case 'fullWidth':
				return styles.separator;
			case 'none':
				return undefined;
			case undefined:
				return showValue ? styles.cellSeparator : styles.separator;
		}
	}

	const getValueComponent = () => {
		return isValueEditable ? (
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
		) : (
			<Text style={ { ...styles.cellValue, ...valueStyle } }>
				{ value }
			</Text>
		);
	};

	return (
		<TouchableOpacity onPress={ onCellPress } style={ styles.clipToBounds } >
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
				{ showValue && getValueComponent() }
				{ children }
			</View>
			{ drawSeparator && (
				<View style={ separatorStyle() } />
			) }
		</TouchableOpacity>
	);
}
