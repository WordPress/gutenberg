/**
 * External dependencies
 */
import { Platform, TouchableOpacity, Text, View } from 'react-native';
/**
 * Internal dependencies
 */
import RangeCell from '../mobile/bottom-sheet/range-cell';
import StepperCell from '../mobile/bottom-sheet/stepper-cell';
import Picker from '../mobile/picker';

/**
 * WordPress dependencies
 */
import { useRef } from '@wordpress/element';
import { withPreferredColorScheme } from '@wordpress/compose';

import styles from './style.scss';

function UnitControl( {
	className,
	currentInput,
	label,
	value,
	instanceId,
	onChange,
	onUnitChange,
	beforeIcon,
	afterIcon,
	help,
	allowReset,
	initialPosition,
	min,
	max,
	separatorType,
	units,
	unit,
	getStylesFromColorScheme,
	...props
} ) {
	const pickerRef = useRef();

	function onPickerSelect( selectedOption ) {
		onUnitChange( selectedOption );
	}

	function onPickerPresent() {
		if ( pickerRef.current ) {
			pickerRef.current.presentPicker();
		}
	}

	const id = `inspector-range-control-${ instanceId }`;
	const currentInputValue = currentInput === null ? value : currentInput;
	const initialSliderValue = isFinite( currentInputValue )
		? currentInputValue
		: initialPosition;

	const unitButtonTextStyle = getStylesFromColorScheme(
		styles.unitButtonText,
		styles.unitButtonTextDark
	);

	const renderUnitButton = () => {
		return (
			<TouchableOpacity
				onPress={ onPickerPresent }
				accessibilityRole="button"
				accessibilityHint="Open picker to choose unit"
			>
				<View style={ styles.unitButton }>
					<Text style={ unitButtonTextStyle }>{ unit }</Text>
				</View>
			</TouchableOpacity>
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
				>
					{ renderUnitButton() }
				</StepperCell>
			) : (
				<RangeCell
					label={ label }
					id={ id }
					help={ help }
					className={ className }
					onChange={ onChange }
					aria-describedby={ !! help ? `${ id }__help` : undefined }
					minimumValue={ min }
					maximumValue={ max }
					value={ value }
					beforeIcon={ beforeIcon }
					afterIcon={ afterIcon }
					allowReset={ allowReset }
					defaultValue={ initialSliderValue }
					separatorType={ separatorType }
					{ ...props }
				>
					{ renderUnitButton() }
				</RangeCell>
			) }

			<Picker
				ref={ pickerRef }
				options={ units }
				onChange={ onPickerSelect }
				hideCancelButton={ Platform.OS !== 'ios' }
				leftAlign={ true }
			/>
		</>
	);
}

export default withPreferredColorScheme( UnitControl );
