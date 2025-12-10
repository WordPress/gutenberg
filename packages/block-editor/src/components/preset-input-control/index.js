/**
 * WordPress dependencies
 */
import {
	Button,
	CustomSelectControl,
	Icon,
	RangeControl,
	__experimentalHStack as HStack,
	__experimentalParseQuantityAndUnitFromRawValue as parseQuantityAndUnitFromRawValue,
} from '@wordpress/components';
import { usePrevious } from '@wordpress/compose';
import { __, sprintf } from '@wordpress/i18n';
import { settings } from '@wordpress/icons';
import { useState, useEffect, useMemo } from '@wordpress/element';

/**
 * Internal dependencies
 */
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

/**
 * PresetInputControl component for selecting preset values or entering custom values.
 *
 * Displays preset values as either a slider (for <= 8 presets) or a select dropdown.
 * Allows toggling to custom value mode with a UnitControl and RangeControl.
 * Handles unit tracking and conversion between preset and custom values.
 *
 * @param {Object}   props                     Component props.
 * @param {boolean}  props.allowNegativeOnDrag Whether to allow negative values during drag operations.
 * @param {string}   props.ariaLabel           Accessible label for the control.
 * @param {string}   props.className           Optional CSS class name.
 * @param {Object}   props.customValueSettings Optional custom value settings for max/steps per unit.
 * @param {boolean}  props.disableCustomValues Whether to disable custom value input.
 * @param {Object}   props.icon                Icon to display alongside the control.
 * @param {boolean}  props.isMixed             Whether the current value is mixed (multiple values).
 * @param {number}   props.minimumCustomValue  Minimum allowed custom value.
 * @param {Function} props.onChange            Callback when value changes.
 * @param {Function} props.onMouseOut          Callback for mouse out events.
 * @param {Function} props.onMouseOver         Callback for mouse over events.
 * @param {Function} props.onUnitChange        Callback when unit changes.
 * @param {Array}    props.presets             Array of preset objects with name, slug, and size.
 * @param {string}   props.presetType          Type of preset (e.g., 'spacing', 'border-radius').
 * @param {string}   props.selectedUnit        Currently selected unit (e.g., 'px', 'em').
 * @param {boolean}  props.showTooltip         Whether to show tooltip on custom UnitControl.
 * @param {Array}    props.units               Array of available unit objects (can include max and step).
 * @param {string}   props.value               Current value (preset or custom).
 *
 * @return {Element} The PresetInputControl component.
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
	presets = [],
	presetType,
	selectedUnit,
	showTooltip,
	units,
} ) {
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

	const allPlaceholder = isMixed ? __( 'Mixed' ) : null;

	const [ minValue, setMinValue ] = useState( minimumCustomValue );
	const [ showCustomValueControl, setShowCustomValueControl ] = useState(
		! disableCustomValues &&
			value !== undefined &&
			! isValuePreset( value, presetType )
	);

	let currentValue = null;

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

	let selectListOptions = presets;
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
		key: index,
		name: size.name,
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

	const handleCustomValueChange = ( newValue ) => {
		const isNumeric = ! isNaN( parseFloat( newValue ) );
		const newCustomValue = isNumeric ? newValue : undefined;

		if ( newCustomValue !== undefined ) {
			onChange( newCustomValue );
		}
	};
	const handleCustomValueSliderChange = ( next ) => {
		onChange( [ next, computedUnit ].join( '' ) );
	};
	const customTooltipContent = ( newValue ) =>
		value === undefined ? undefined : presets[ newValue ]?.name;

	const getNewPresetValue = ( next, controlType ) => {
		const newValue = parseInt( next, 10 );

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
		return `var:preset|${ presetType }|${ presets[ next ]?.slug }`;
	};

	return (
		<HStack
			className={ `preset-input-control__wrapper ${ className }__wrapper` }
		>
			{ icon && (
				<Icon
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
					aria-valuenow={ currentValue }
					aria-valuetext={ presets[ currentValue ]?.name }
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
					value={ currentValue }
					withInputField={ false }
					__next40pxDefaultSize
					__nextHasNoMarginBottom
				/>
			) }
			{ hasPresets && ! showRangeControl && ! showCustomValueControl && (
				<CustomSelectControl
					className="preset-input-control__custom-select-control"
					hideLabelFromVision
					label={ ariaLabel }
					onBlur={ onMouseOut }
					onChange={ ( selection ) => {
						if (
							showCustomValueInSelectList &&
							selection.selectedItem.key === options.length - 1
						) {
							setShowCustomValueControl( true );
						} else {
							onChange(
								getNewPresetValue(
									selection.selectedItem.key,
									'selectList'
								)
							);
						}
					} }
					onFocus={ onMouseOver }
					onMouseOut={ onMouseOut }
					onMouseOver={ onMouseOver }
					options={ options }
					size="__unstable-large"
					value={
						// passing empty string as a fallback to continue using the
						// component in controlled mode
						options.find(
							( option ) => option.key === currentValue
						) || ''
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
