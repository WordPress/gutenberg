import {
	Button,
	Icon as WCIcon,
	RangeControl,
	__experimentalHStack as HStack,
	__experimentalParseQuantityAndUnitFromRawValue as parseQuantityAndUnitFromRawValue,
} from '@wordpress/components';
import { SelectControl } from '@wordpress/ui';
import { usePrevious } from '@wordpress/compose';
import { __, sprintf } from '@wordpress/i18n';
import { settings } from '@wordpress/icons';
import { useState, useEffect, useMemo } from '@wordpress/element';
import {
	CUSTOM_VALUE_SETTINGS,
	ICON_SIZE,
	RANGE_CONTROL_MAX_SIZE,
} from './constants';
import {
	getCustomValueFromPreset,
	getPresetValueFromCustomValue,
	getSliderValueFromPreset,
	isValuePreset,
} from './utils';
import CustomValueControls from './custom-value-controls';
import type { Preset, PresetInputControlProps } from './types';

/**
 * PresetInputControl component for selecting preset values or entering custom values.
 *
 * Displays preset values as either a slider (for <= 8 presets) or a select dropdown.
 * Allows toggling to custom value mode with a UnitControl and RangeControl.
 * Handles unit tracking and conversion between preset and custom values.
 *
 * @param props                     Component props.
 * @param props.allowNegativeOnDrag Whether to allow negative values during drag operations.
 * @param props.ariaLabel           Accessible label for the control.
 * @param props.className           Optional CSS class name.
 * @param props.customValueSettings Optional custom value settings for max/steps per unit.
 * @param props.disableCustomValues Whether to disable custom value input.
 * @param props.icon                Icon to display alongside the control.
 * @param props.isMixed             Whether the current value is mixed (multiple values).
 * @param props.minimumCustomValue  Minimum allowed custom value.
 * @param props.onChange            Callback when value changes.
 * @param props.onMouseOut          Callback for mouse out events.
 * @param props.onMouseOver         Callback for mouse over events.
 * @param props.onUnitChange        Callback when unit changes.
 * @param props.placeholder         Placeholder text forwarded to the inner UnitControl when
 *                                  rendered in custom-value mode.
 * @param props.presets             Array of preset objects with name, slug, and size.
 * @param props.presetType          Type of preset (e.g., 'spacing', 'border-radius').
 * @param props.selectedUnit        Currently selected unit (e.g., 'px', 'em').
 * @param props.showTooltip         Whether to show tooltip on custom UnitControl.
 * @param props.units               Array of available unit objects (can include max and step).
 * @param props.value               Current value (preset or custom).
 *
 * @return The PresetInputControl component.
 */
export default function PresetInputControl( {
	allowNegativeOnDrag = false,
	ariaLabel,
	className: classNameProp,
	customValueSettings = CUSTOM_VALUE_SETTINGS,
	disableCustomValues,
	icon,
	isMixed,
	value: valueProp,
	minimumCustomValue,
	onChange,
	onMouseOut,
	onMouseOver,
	onUnitChange,
	placeholder,
	presets = [],
	presetType,
	selectedUnit,
	showTooltip,
	units,
}: PresetInputControlProps ) {
	const value = useMemo(
		() => getPresetValueFromCustomValue( valueProp, presets, presetType ),
		[ valueProp, presets, presetType ]
	);

	const className = classNameProp ?? 'preset-input-control';

	const marks = presets
		.slice( 1, presets.length - 1 )
		.map( ( _newValue, index ) => ( {
			value: index + 1,
			label: undefined,
		} ) );
	const hasPresets = marks.length > 0;
	const showRangeControl = presets.length <= RANGE_CONTROL_MAX_SIZE;

	const allPlaceholder = isMixed ? __( 'Mixed' ) : ( placeholder ?? null );

	const [ minValue, setMinValue ] = useState( minimumCustomValue );
	const [ showCustomValueControl, setShowCustomValueControl ] = useState(
		! disableCustomValues &&
			value !== undefined &&
			! isValuePreset( value, presetType )
	);

	let currentValue: number | string | null | undefined = null;

	const previousValue = usePrevious( value );

	useEffect( () => {
		if (
			!! value &&
			previousValue !== value &&
			! isValuePreset( value, presetType ) &&
			showCustomValueControl !== true
		) {
			setShowCustomValueControl( true );
		}
	}, [ value, previousValue, presetType, showCustomValueControl ] );

	const showCustomValueInSelectList =
		! showRangeControl &&
		! showCustomValueControl &&
		value !== undefined &&
		( ! isValuePreset( value, presetType ) ||
			( isValuePreset( value, presetType ) && isMixed ) );

	let selectListOptions: Preset[] = presets;
	if ( showCustomValueInSelectList ) {
		selectListOptions = [
			...presets,
			{
				name: ! isMixed
					? // translators: %s: A custom measurement, e.g. a number followed by a unit like 12px.
						sprintf( __( 'Custom (%s)' ), value )
					: __( 'Mixed' ),
				slug: 'custom',
				size: value,
			},
		];
		currentValue = selectListOptions.length - 1;
	} else if ( ! isMixed ) {
		currentValue = ! showCustomValueControl
			? getSliderValueFromPreset( value, presets, presetType )
			: getCustomValueFromPreset( value, presets, presetType );
	}

	const options = selectListOptions.map( ( size, index ) => ( {
		value: String( index ),
		label: size.name ?? '',
	} ) );

	const resolvedPresetValue = isValuePreset( value, presetType )
		? getCustomValueFromPreset( value, presets, presetType )
		: value;

	const [ parsedQuantity, parsedUnit ] =
		parseQuantityAndUnitFromRawValue( resolvedPresetValue );

	const computedUnit = parsedUnit || selectedUnit || 'px';

	// Get step and max from units prop, falling back to customValueSettings
	const unitConfig = units?.find( ( item ) => item.value === computedUnit );
	const step =
		unitConfig?.step ?? customValueSettings[ computedUnit ]?.steps ?? 0.1;
	const max =
		unitConfig?.max ?? customValueSettings[ computedUnit ]?.max ?? 10;

	const handleCustomValueChange = ( newValue?: string ) => {
		// Treat empty or undefined as an explicit clear and propagate undefined.
		if ( newValue === undefined || newValue === '' ) {
			onChange( undefined );
			return;
		}

		// Ignore non-numeric intermediate input (e.g. just a unit).
		if ( isNaN( parseFloat( newValue ) ) ) {
			return;
		}

		onChange( newValue );
	};
	const handleCustomValueSliderChange = ( next?: number ) => {
		onChange( [ next, computedUnit ].join( '' ) );
	};
	const customTooltipContent = ( newValue?: number | '' | null ) =>
		// The tooltip gets the slider position.
		value === undefined ? undefined : presets[ newValue as number ]?.name;

	const getNewPresetValue = (
		next: number | string | undefined,
		controlType?: string
	) => {
		// `parseInt` reads a number as its string form.
		const newValue = parseInt( next as string, 10 );

		if ( controlType === 'selectList' ) {
			if ( newValue === 0 && presets[ 0 ]?.slug === '0' ) {
				return '0';
			}
			if ( newValue === 0 ) {
				return undefined;
			}
		} else if ( newValue === 0 ) {
			return '0';
		}
		// The next value is a preset index.
		return `var:preset|${ presetType }|${ presets[ next as number ]?.slug }`;
	};

	return (
		<HStack
			className={ `preset-input-control__wrapper ${ className }__wrapper` }
		>
			{ icon && (
				<WCIcon
					className="preset-input-control__icon"
					icon={ icon }
					size={ ICON_SIZE }
				/>
			) }
			{ ( ! hasPresets || showCustomValueControl ) && (
				<CustomValueControls
					allowNegativeOnDrag={ allowNegativeOnDrag }
					ariaLabel={ ariaLabel }
					allPlaceholder={ allPlaceholder }
					minValue={ minValue }
					parsedQuantity={ parsedQuantity }
					computedUnit={ computedUnit }
					units={ units }
					isMixed={ isMixed }
					step={ step }
					max={ max }
					showTooltip={ showTooltip }
					value={ value }
					minimumCustomValue={ minimumCustomValue }
					onCustomValueChange={ handleCustomValueChange }
					onCustomValueSliderChange={ handleCustomValueSliderChange }
					onUnitChange={ onUnitChange }
					onMouseOut={ onMouseOut }
					onMouseOver={ onMouseOver }
					setMinValue={ setMinValue }
				/>
			) }
			{ hasPresets && showRangeControl && ! showCustomValueControl && (
				<RangeControl
					// In preset mode the current value is a slider position.
					aria-valuenow={ currentValue as number | undefined }
					// In preset mode the current value is a slider position.
					aria-valuetext={ presets[ currentValue as number ]?.name }
					className="preset-input-control__preset-range"
					hideLabelFromVision
					initialPosition={ 0 }
					label={ ariaLabel }
					max={ presets.length - 1 }
					marks={ marks }
					min={ 0 }
					onBlur={ onMouseOut }
					onChange={ ( newValue ) =>
						onChange( getNewPresetValue( newValue ) )
					}
					onFocus={ onMouseOver }
					onMouseDown={ ( event ) => {
						// If mouse down is near start of range set initial value to 0, which
						// prevents the user have to drag right then left to get 0 setting.
						const nearStart = event?.nativeEvent?.offsetX < 35;
						if ( nearStart && value === undefined ) {
							onChange( '0' );
						}
					} }
					onMouseOut={ onMouseOut }
					onMouseOver={ onMouseOver }
					renderTooltipContent={ customTooltipContent }
					step={ 1 }
					value={ currentValue as number | undefined }
					withInputField={ false }
				/>
			) }
			{ hasPresets && ! showRangeControl && ! showCustomValueControl && (
				<SelectControl
					label={ ariaLabel }
					hideLabelFromVision
					items={ options }
					onValueChange={ ( selection ) => {
						if ( ! selection || selection.value === null ) {
							return;
						}
						if (
							showCustomValueInSelectList &&
							selection.value === String( options.length - 1 )
						) {
							setShowCustomValueControl( true );
						} else {
							onChange(
								getNewPresetValue(
									selection.value,
									'selectList'
								)
							);
						}
					} }
					value={
						options.find(
							( option ) =>
								option.value === String( currentValue )
						) ?? options[ 0 ]
					}
					trigger={
						<SelectControl.Trigger
							className="preset-input-control__custom-select-control"
							onBlur={ onMouseOut }
							onFocus={ onMouseOver }
							onMouseOut={ onMouseOut }
							onMouseOver={ onMouseOver }
						/>
					}
				/>
			) }
			{ hasPresets && ! disableCustomValues && (
				<Button
					className="preset-input-control__custom-toggle"
					icon={ settings }
					iconSize={ ICON_SIZE }
					isPressed={ showCustomValueControl }
					label={
						showCustomValueControl
							? __( 'Use preset' )
							: __( 'Set custom value' )
					}
					onClick={ () => {
						setShowCustomValueControl( ! showCustomValueControl );
					} }
					size="small"
				/>
			) }
		</HStack>
	);
}
