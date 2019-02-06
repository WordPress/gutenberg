/**
* External dependencies
*/
import { TouchableOpacity, Text, View } from 'react-native';

/**
 * WordPress dependencies
 */
import { Dashicon, SelectControl } from '@wordpress/components';

/**
 * Internal dependencies
 */
import styles from './styles.scss';

export default function Cell( props ) {
	const {
		label, 
		value,
		options, 
		drawSeparator = true,
		icon,
		labelStyle = {},
		valueStyle = {},
		onChangeValue,
		...valueProps
	} = props;

	const defaultLabelStyle = styles.cellLabel;
	let picker;

	const onCellPress = () => {
		picker.presentSelector();
	};

	const onChange = ( newValue ) => {
		onChangeValue( newValue );
	}

	return (
		<TouchableOpacity onPress={ onCellPress } >
			<SelectControl 
				ref={ ( instance ) => picker = instance }
				options={ options }
				onChange={ onChange }
			/>
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
				<Text
					numberOfLines={ 1 }
					style={ { ...styles.cellValue, ...valueStyle } }
					{ ...valueProps }
				>
					{ value }
				</Text>
			</View>
			{ drawSeparator && (
				<View style={ styles.cellSeparator } />
			) }
			
		</TouchableOpacity>
	);
}
