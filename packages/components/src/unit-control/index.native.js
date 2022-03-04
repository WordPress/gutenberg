/**
 * External dependencies
 */
import {
	Text,
	View,
	TouchableWithoutFeedback,
	Platform,
	findNodeHandle,
} from 'react-native';

/**
 * Internal dependencies
 */
import RangeCell from '../mobile/bottom-sheet/range-cell';
import StepperCell from '../mobile/bottom-sheet/stepper-cell';
import Picker from '../mobile/picker';
import styles from './style.scss';
import {
	CSS_UNITS,
	hasUnits,
	getAccessibleLabelForUnit,
	getUnitsWithCurrentUnit,
	getParsedQuantityAndUnit,
} from './utils';

/**
 * WordPress dependencies
 */
import { useRef, useCallback, useMemo, memo } from '@wordpress/element';
import { withPreferredColorScheme } from '@wordpress/compose';
import { __, sprintf } from '@wordpress/i18n';

const shouldShowPicker = ( units ) => {
	return hasUnits( units ) && units?.length > 1;
};

/**
 * Notes:
 *   - Goal: we want to stop using `false` as a value for 'UNITS'
 *   - The internal logic should be:
 *     - The units array should have a list of allowed units
 *     - Therefore, if the `units` prop is an empty array, there shouldn't be any UI shown for the unit, and the rawValue's unit should be `undefined`
 *
 *
 *   - The Native UnitControl's internal logic still relies on `unit` holding the `unit value` and `value` holding the `quantity`
 *     - Use `getParsedQuantityAndUnit` to take into account value, unit and units and parse the resulting unit
 *     - Render the button only if `units` has at least 1 item, and render the select if it has at least 2 items.
 */

function UnitControl( {
	currentInput,
	label,
	value: valueProp,
	onChange,
	onUnitChange,
	initialPosition,
	min,
	max,
	separatorType,
	units: unitsProp = CSS_UNITS,
	unit: unitProp,
	getStylesFromColorScheme,
	disableUnits,
	...props
} ) {
	const pickerRef = useRef();
	const anchorNodeRef = useRef();

	const onPickerPresent = useCallback( () => {
		if ( pickerRef?.current ) {
			pickerRef.current.presentPicker();
		}
	}, [ pickerRef?.current ] );

	// Force value to `undefined` in case it was `null`.
	const currentInputValue =
		( currentInput === null ? valueProp : currentInput ) ?? undefined;
	const initialControlValue = isFinite( currentInputValue )
		? currentInputValue
		: initialPosition;

	const nonNullValueProp = initialControlValue ?? undefined;
	const units = useMemo(
		() => getUnitsWithCurrentUnit( nonNullValueProp, unitProp, unitsProp ),
		[ nonNullValueProp, unitProp, unitsProp ]
	);
	const [ parsedQuantity, parsedUnit ] = getParsedQuantityAndUnit(
		nonNullValueProp,
		unitProp,
		units
	);

	const unitButtonTextStyle = getStylesFromColorScheme(
		styles.unitButtonText,
		styles.unitButtonTextDark
	);

	const accessibilityLabel = sprintf(
		/* translators: accessibility text. Inform about current unit value. %s: Current unit value. */
		__( 'Current unit is %s' ),
		parsedUnit
	);

	const accessibilityHint =
		Platform.OS === 'ios'
			? __( 'Double tap to open Action Sheet with available options' )
			: __( 'Double tap to open Bottom Sheet with available options' );

	const renderUnitButton = useMemo( () => {
		const unitButton = (
			<View style={ styles.unitButton }>
				<Text style={ unitButtonTextStyle }>{ parsedUnit }</Text>
			</View>
		);

		if ( shouldShowPicker( units ) ) {
			return (
				<TouchableWithoutFeedback
					onPress={ onPickerPresent }
					accessibilityLabel={ accessibilityLabel }
					accessibilityRole="button"
					accessibilityHint={ accessibilityHint }
				>
					{ unitButton }
				</TouchableWithoutFeedback>
			);
		}

		return unitButton;
	}, [
		onPickerPresent,
		accessibilityLabel,
		accessibilityHint,
		unitButtonTextStyle,
		parsedUnit,
		units,
	] );

	const getAnchor = useCallback(
		() =>
			anchorNodeRef?.current
				? findNodeHandle( anchorNodeRef?.current )
				: undefined,
		[ anchorNodeRef?.current ]
	);

	const getDecimal = ( step ) => {
		// Return the decimal offset based on the step size.
		// if step size is 0.1 we expect the offset to be 1.
		// for example 12 + 0.1 we would expect the see 12.1 (not 12.10 or 12 );
		// steps are defined in the CSS_UNITS and they vary from unit to unit.
		const stepToString = step;
		const splitStep = stepToString.toString().split( '.' );
		return splitStep[ 1 ] ? splitStep[ 1 ].length : 0;
	};

	const renderUnitPicker = useCallback( () => {
		// Keeping for legacy reasons, although `false` should not be a valid
		// value for the `units` prop anymore.
		if ( disableUnits || units === false ) {
			return null;
		}
		return (
			<View style={ styles.unitMenu } ref={ anchorNodeRef }>
				{ /*
				 * If units is an array of at least 2 items, show an interactive unit text,
				 * that opens a picker when tapped.
				 * Otherwise, just show the same text (but not interactive)
				 */ }
				{ renderUnitButton }
				{ shouldShowPicker( units ) ? (
					<Picker
						ref={ pickerRef }
						options={ units }
						onChange={ onUnitChange }
						hideCancelButton
						leftAlign
						getAnchor={ getAnchor }
					/>
				) : null }
			</View>
		);
	}, [ pickerRef, units, onUnitChange, getAnchor, renderUnitButton ] );

	let step = props.step;

	/*
	 * If no step prop has been passed, lookup the active unit and
	 * try to get step from `units`, or default to a value of `1`
	 */
	if ( ! step && units ) {
		const activeUnit = units.find(
			( option ) => option.value === parsedUnit
		);
		step = activeUnit?.step ?? 1;
	}

	const decimalNum = getDecimal( step );

	return (
		<>
			{ parsedUnit !== '%' ? (
				<StepperCell
					label={ label }
					max={ max }
					min={ min }
					onChange={ onChange }
					separatorType={ separatorType }
					value={ parsedQuantity }
					step={ step }
					defaultValue={ initialControlValue }
					shouldDisplayTextInput
					decimalNum={ decimalNum }
					openUnitPicker={ onPickerPresent }
					unitLabel={ getAccessibleLabelForUnit( parsedUnit ) }
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
					value={ parsedQuantity }
					step={ step }
					unit={ parsedUnit }
					defaultValue={ initialControlValue }
					separatorType={ separatorType }
					decimalNum={ decimalNum }
					openUnitPicker={ onPickerPresent }
					unitLabel={ getAccessibleLabelForUnit( parsedUnit ) }
					{ ...props }
				>
					{ renderUnitPicker() }
				</RangeCell>
			) }
		</>
	);
}

export { useCustomUnits } from './utils';
export default memo( withPreferredColorScheme( UnitControl ) );
