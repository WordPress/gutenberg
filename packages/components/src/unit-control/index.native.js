/**
 * External dependencies
 */
import { Platform } from 'react-native';
/**
 * Internal dependencies
 */
import RangeCell from '../mobile/bottom-sheet/range-cell';
import Picker from '../mobile/picker';

/**
 * WordPress dependencies
 */
import { useRef } from '@wordpress/element';

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

	return (
		<>
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
				customActionButton={ { title: unit, handler: onPickerPresent } }
				{ ...props }
			/>
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

export default UnitControl;
