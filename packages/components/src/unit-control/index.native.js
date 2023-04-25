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
import { CSS_UNITS, hasUnits, getAccessibleLabelForUnit } from './utils';

/**
 * WordPress dependencies
 */
import { useRef, useCallback, useMemo, memo } from '@wordpress/element';
import { withPreferredColorScheme } from '@wordpress/compose';
import { __, sprintf } from '@wordpress/i18n';

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
	...props
} ) {
	const pickerRef = useRef();
	const anchorNodeRef = useRef();

	const onPickerPresent = useCallback( () => {
		if ( pickerRef?.current ) {
			pickerRef.current.presentPicker();
		}
		// Disable reason: this should be fixed by the native team.
		// It would be great if this could be done in the context of
		// https://github.com/WordPress/gutenberg/pull/39218
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [ pickerRef?.current ] );

	const currentInputValue = currentInput === null ? value : currentInput;
	const initialControlValue = isFinite( currentInputValue )
		? currentInputValue
		: initialPosition;

	const unitButtonTextStyle = getStylesFromColorScheme(
		styles.unitButtonText,
		styles.unitButtonTextDark
	);

	/* translators: accessibility text. Inform about current unit value. %s: Current unit value. */
	const accessibilityLabel = sprintf( __( 'Current unit is %s' ), unit );

	const accessibilityHint =
		Platform.OS === 'ios'
			? __( 'Double tap to open Action Sheet with available options' )
			: __( 'Double tap to open Bottom Sheet with available options' );

	const renderUnitButton = useMemo( () => {
		const unitButton = (
			<View style={ styles.unitButton }>
				<Text style={ unitButtonTextStyle }>{ unit }</Text>
			</View>
		);

		if ( hasUnits( units ) && units?.length > 1 ) {
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
		unit,
		units,
	] );

	const getAnchor = useCallback(
		() =>
			anchorNodeRef?.current
				? findNodeHandle( anchorNodeRef?.current )
				: undefined,
		// Disable reason: this should be fixed by the native team.
		// It would be great if this could be done in the context of
		// https://github.com/WordPress/gutenberg/pull/39218
		// eslint-disable-next-line react-hooks/exhaustive-deps
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
		if ( units === false ) {
			return null;
		}
		return (
			<View style={ styles.unitMenu } ref={ anchorNodeRef }>
				{ renderUnitButton }
				{ hasUnits( units ) && units?.length > 1 ? (
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
		const activeUnit = units.find( ( option ) => option.value === unit );
		step = activeUnit?.step ?? 1;
	}

	const decimalNum = getDecimal( step );

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
					step={ step }
					defaultValue={ initialControlValue }
					shouldDisplayTextInput
					decimalNum={ decimalNum }
					openUnitPicker={ onPickerPresent }
					unitLabel={ getAccessibleLabelForUnit( unit ) }
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
					step={ step }
					unit={ unit }
					defaultValue={ initialControlValue }
					separatorType={ separatorType }
					decimalNum={ decimalNum }
					openUnitPicker={ onPickerPresent }
					unitLabel={ getAccessibleLabelForUnit( unit ) }
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
