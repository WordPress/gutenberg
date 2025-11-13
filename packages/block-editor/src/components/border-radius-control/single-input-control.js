/**
 * Internal dependencies
 */
import PresetInputControl from '../preset-input-control';
import { getPresetValueFromCustomValue } from '../preset-input-control/utils';
import { getAllValue, convertPresetsToCustomValues } from './utils';
import {
	CORNERS,
	ICONS,
	MIN_BORDER_RADIUS_VALUE,
	MAX_BORDER_RADIUS_VALUES,
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

	const onChangeUnit = ( next ) => {
		const newUnits = { ...selectedUnits };
		if ( corner === 'all' ) {
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
		value = getPresetValueFromCustomValue(
			customValue,
			presets,
			'border-radius'
		);
	} else {
		value = getPresetValueFromCustomValue(
			values[ corner ],
			presets,
			'border-radius'
		);
	}

	// Determine the selected unit for this corner
	const selectedUnit = selectedUnits[ corner ] || selectedUnits.flat || 'px';

	// Build units array with max values from MAX_BORDER_RADIUS_VALUES
	const unitsWithMax = units?.map( ( unit ) => ( {
		...unit,
		max: MAX_BORDER_RADIUS_VALUES[ unit.value ] ?? unit.max,
	} ) );

	const icon = ICONS[ corner ];
	const ariaLabel = CORNERS[ corner ];

	return (
		<PresetInputControl
			allowNegativeOnDrag={ false }
			ariaLabel={ ariaLabel }
			className="components-border-radius-control"
			disableCustomValues={ false }
			icon={ icon }
			isMixed={ false }
			minimumCustomValue={ MIN_BORDER_RADIUS_VALUE }
			onChange={ changeCornerValue }
			onUnitChange={ onChangeUnit }
			presets={ presets }
			presetType="border-radius"
			selectedUnit={ selectedUnit }
			showTooltip
			units={ unitsWithMax }
			value={ value }
		/>
	);
}
