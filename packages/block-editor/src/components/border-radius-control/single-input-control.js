/**
 * WordPress dependencies
 */
import {
	__experimentalParseQuantityAndUnitFromRawValue as parseQuantityAndUnitFromRawValue,
	__experimentalUnitControl as UnitControl,
	__experimentalHStack as HStack,
	Icon,
	Tooltip,
	RangeControl,
	Button,
	CustomSelectControl,
} from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { useState } from '@wordpress/element';
import { settings } from '@wordpress/icons';

/**
 * Internal dependencies
 */
import {
	getAllValue,
	getCustomValueFromPreset,
	getPresetValueFromControlValue,
	getPresetValueFromCustomValue,
	getSliderValueFromPreset,
	isValuePreset,
	convertPresetsToCustomValues,
} from './utils';
import {
	CORNERS,
	ICONS,
	MIN_BORDER_RADIUS_VALUE,
	MAX_BORDER_RADIUS_VALUES,
	RANGE_CONTROL_MAX_SIZE,
} from './constants';

export default function SingleInputControl( {
	corner,
	onChange,
	selectedUnits,
	setSelectedUnits,
	values: valuesProp,
	units,
	presets,
} ) {
	const changeCornerValue = ( validatedValue ) => {
		if ( corner === 'all' ) {
			onChange( {
				topLeft: validatedValue,
				topRight: validatedValue,
				bottomLeft: validatedValue,
				bottomRight: validatedValue,
			} );
		} else {
			onChange( {
				...values,
				[ corner ]: validatedValue,
			} );
		}
	};

	const onChangeValue = ( next ) => {
		if ( ! onChange ) {
			return;
		}

		// Filter out CSS-unit-only values to prevent invalid styles.
		const isNumeric = ! isNaN( parseFloat( next ) );
		const nextValue = isNumeric ? next : undefined;
		changeCornerValue( nextValue );
	};

	const onChangeUnit = ( next ) => {
		const newUnits = { ...selectedUnits };
		if ( corner === 'all' ) {
			newUnits.flat = next;
			newUnits.topLeft = next;
			newUnits.topRight = next;
			newUnits.bottomLeft = next;
			newUnits.bottomRight = next;
		} else {
			newUnits[ corner ] = next;
		}
		setSelectedUnits( newUnits );
	};

	// For shorthand style & backwards compatibility, handle flat string value.
	const values =
		typeof valuesProp !== 'string'
			? valuesProp
			: {
					topLeft: valuesProp,
					topRight: valuesProp,
					bottomLeft: valuesProp,
					bottomRight: valuesProp,
			  };

	// For 'all' corner, convert presets to custom values before calling getAllValue
	// For individual corners, check if the value should be converted to a preset
	let value;
	if ( corner === 'all' ) {
		const convertedValues = convertPresetsToCustomValues( values, presets );
		const customValue = getAllValue( convertedValues );
		value = getPresetValueFromCustomValue( customValue, presets );
	} else {
		value = getPresetValueFromCustomValue( values[ corner ], presets );
	}
	const resolvedPresetValue = isValuePreset( value )
		? getCustomValueFromPreset( value, presets )
		: value;
	const [ parsedQuantity, parsedUnit ] =
		parseQuantityAndUnitFromRawValue( resolvedPresetValue );
	const computedUnit = value
		? parsedUnit
		: selectedUnits[ corner ] || selectedUnits.flat || 'px';
	const unitConfig =
		units && units.find( ( item ) => item.value === computedUnit );
	const step = unitConfig?.step || 1;
	const [ showCustomValueControl, setShowCustomValueControl ] = useState(
		value !== undefined && ! isValuePreset( value )
	);
	const showRangeControl = presets.length <= RANGE_CONTROL_MAX_SIZE;
	const presetIndex = getSliderValueFromPreset( value, presets );
	const rangeTooltip = ( newValue ) =>
		value === undefined ? undefined : presets[ newValue ]?.name;
	const marks = presets
		.slice( 1, presets.length - 1 )
		.map( ( _newValue, index ) => ( {
			value: index + 1,
			label: undefined,
		} ) );
	const hasPresets = marks.length > 0;
	let options = [];
	if ( ! showRangeControl ) {
		options = [
			...presets,
			{
				name: __( 'Custom' ),
				slug: 'custom',
				size: resolvedPresetValue,
			},
		].map( ( size, index ) => ( {
			key: index,
			name: size.name,
		} ) );
	}
	const icon = ICONS[ corner ];

	const handleSliderChange = ( next ) => {
		const val =
			next !== undefined ? `${ next }${ computedUnit }` : undefined;
		changeCornerValue( val );
	};

	// Controls are wrapped in tooltips as visible labels aren't desired here.
	// Tooltip rendering also requires the UnitControl to be wrapped. See:
	// https://github.com/WordPress/gutenberg/pull/24966#issuecomment-685875026
	return (
		<HStack>
			{ icon && (
				<Icon
					className="components-border-radius-control__icon"
					icon={ icon }
					size={ 24 }
				/>
			) }
			{ ( ! hasPresets || showCustomValueControl ) && (
				<div className="components-border-radius-control__input-controls-wrapper">
					<Tooltip text={ CORNERS[ corner ] } placement="top">
						<div className="components-border-radius-control__tooltip-wrapper">
							<UnitControl
								className="components-border-radius-control__unit-control"
								aria-label={ CORNERS[ corner ] }
								value={ [ parsedQuantity, computedUnit ].join(
									''
								) }
								onChange={ onChangeValue }
								onUnitChange={ onChangeUnit }
								size="__unstable-large"
								min={ MIN_BORDER_RADIUS_VALUE }
								units={ units }
							/>
						</div>
					</Tooltip>
					<RangeControl
						__next40pxDefaultSize
						label={ __( 'Border radius' ) }
						hideLabelFromVision
						className="components-border-radius-control__range-control"
						value={ parsedQuantity ?? '' }
						min={ MIN_BORDER_RADIUS_VALUE }
						max={ MAX_BORDER_RADIUS_VALUES[ computedUnit ] }
						initialPosition={ 0 }
						withInputField={ false }
						onChange={ handleSliderChange }
						step={ step }
						__nextHasNoMarginBottom
					/>
				</div>
			) }
			{ hasPresets && showRangeControl && ! showCustomValueControl && (
				<RangeControl
					__next40pxDefaultSize
					className="components-border-radius-control__range-control"
					value={ presetIndex }
					onChange={ ( newSize ) => {
						changeCornerValue(
							getPresetValueFromControlValue(
								newSize,
								'range',
								presets
							)
						);
					} }
					withInputField={ false }
					aria-valuenow={ presetIndex }
					aria-valuetext={ presets[ presetIndex ]?.name }
					renderTooltipContent={ rangeTooltip }
					min={ 0 }
					max={ presets.length - 1 }
					marks={ marks }
					label={ CORNERS[ corner ] }
					hideLabelFromVision
					__nextHasNoMarginBottom
				/>
			) }

			{ ! showRangeControl && ! showCustomValueControl && (
				<CustomSelectControl
					className="components-border-radius-control__custom-select-control"
					value={
						options.find(
							( option ) => option.key === presetIndex
						) || options[ options.length - 1 ]
					}
					onChange={ ( selection ) => {
						if (
							selection.selectedItem.key ===
							options.length - 1
						) {
							setShowCustomValueControl( true );
						} else {
							changeCornerValue(
								getPresetValueFromControlValue(
									selection.selectedItem.key,
									'selectList',
									presets
								)
							);
						}
					} }
					options={ options }
					label={ CORNERS[ corner ] }
					hideLabelFromVision
					size="__unstable-large"
				/>
			) }
			{ hasPresets && (
				<Button
					label={
						showCustomValueControl
							? __( 'Use border radius preset' )
							: __( 'Set custom border radius' )
					}
					icon={ settings }
					onClick={ () => {
						setShowCustomValueControl( ! showCustomValueControl );
					} }
					isPressed={ showCustomValueControl }
					size="small"
					className="components-border-radius-control__custom-toggle"
					iconSize={ 24 }
				/>
			) }
		</HStack>
	);
}
