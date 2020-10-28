/**
 * External dependencies
 */
import { Platform, Text, View, TouchableWithoutFeedback } from 'react-native';
import Menu, { MenuItem } from 'react-native-material-menu';
/**
 * Internal dependencies
 */
import RangeCell from '../mobile/bottom-sheet/range-cell';
import StepperCell from '../mobile/bottom-sheet/stepper-cell';
import Picker from '../mobile/picker';
import styles from './style.scss';
import { CSS_UNITS } from './utils';
/**
 * WordPress dependencies
 */
import { useRef } from '@wordpress/element';
import { withPreferredColorScheme } from '@wordpress/compose';

const isIOS = Platform.OS === 'ios';

function UnitControl( {
	currentInput,
	label,
	value,
	onChange,
	onUnitChange,
	initialPosition,
	min,
	max,
	separatorType,
	units = CSS_UNITS,
	unit,
	getStylesFromColorScheme,
	decimalNum,
	...props
} ) {
	const pickerRef = useRef();
	const menuRef = useRef();

	function onPickerSelect( selectedOption ) {
		onUnitChange( selectedOption );
		if ( menuRef?.current && ! isIOS ) {
			menuRef.current.hide();
		}
	}

	function onPickerPresent() {
		if ( pickerRef?.current && isIOS ) {
			pickerRef.current.presentPicker();
		} else if ( menuRef?.current && ! isIOS ) {
			menuRef.current.show();
		}
	}

	const currentInputValue = currentInput === null ? value : currentInput;
	const initialControlValue = isFinite( currentInputValue )
		? currentInputValue
		: initialPosition;

	const unitButtonTextStyle = getStylesFromColorScheme(
		styles.unitButtonText,
		styles.unitButtonTextDark
	);

	const renderUnitButton = () => {
		return (
			<TouchableWithoutFeedback onPress={ onPickerPresent }>
				<View style={ styles.unitButton }>
					<Text style={ unitButtonTextStyle }>{ unit }</Text>
				</View>
			</TouchableWithoutFeedback>
		);
	};

	const renderUnitPicker = () => {
		if ( isIOS ) {
			return (
				<>
					{ renderUnitButton() }
					<Picker
						ref={ pickerRef }
						options={ units }
						onChange={ onPickerSelect }
						hideCancelButton={ false }
						leftAlign={ true }
					/>
				</>
			);
		}
		return (
			<View style={ styles.unitMenu }>
				<Menu ref={ menuRef } button={ renderUnitButton() }>
					<View>
						{ units.map( ( unitItem ) => {
							return (
								<MenuItem
									key={ unit.label }
									onPress={ () =>
										onPickerSelect( unitItem.value )
									}
								>
									<Text>{ unitItem.label }</Text>
								</MenuItem>
							);
						} ) }
					</View>
				</Menu>
			</View>
		);
	};

	return (
		<>
			{ unit !== '%' ? (
				<StepperCell
					label={ label }
					max={ max }
					min={ min }
					onChange={ onChange }
					separatorType={ separatorType }
					value={ value }
					defaultValue={ initialControlValue }
					shouldDisplayTextInput={ true }
					decimalNum={ unit === 'px' ? 0 : decimalNum }
					{ ...props }
				>
					{ renderUnitPicker() }
				</StepperCell>
			) : (
				<RangeCell
					label={ label }
					onChange={ onChange }
					minimumValue={ min }
					maximumValue={ max }
					value={ value }
					defaultValue={ initialControlValue }
					separatorType={ separatorType }
					decimalNum={ decimalNum }
					{ ...props }
				>
					{ renderUnitPicker() }
				</RangeCell>
			) }
		</>
	);
}

export default withPreferredColorScheme( UnitControl );
