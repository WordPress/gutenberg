/**
 * External dependencies
 */
import { Text, View, TouchableWithoutFeedback } from 'react-native';
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

	function onPickerSelect( selectedOption ) {
		onUnitChange( selectedOption );
	}

	function onPickerPresent() {
		if ( pickerRef?.current ) {
			pickerRef.current.presentPicker();
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
		return (
			<View style={ styles.unitMenu }>
				{ renderUnitButton() }
				<Picker
					ref={ pickerRef }
					options={ units }
					onChange={ onPickerSelect }
					hideCancelButton
					leftAlign={ true }
				/>
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
