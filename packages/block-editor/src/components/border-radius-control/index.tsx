import {
	BaseControl,
	__experimentalParseQuantityAndUnitFromRawValue as parseQuantityAndUnitFromRawValue,
	__experimentalUseCustomUnits as useCustomUnits,
	__experimentalVStack as VStack,
	__experimentalHStack as HStack,
} from '@wordpress/components';
import { useState, useMemo } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import LinkedButton from './linked-button';
import { useSettings } from '../use-settings';
import { hasDefinedValues, hasMixedValues, getAllValue } from './utils';
import PresetInputControl from '../preset-input-control';
import {
	RANGE_CONTROL_MAX_SIZE,
	EMPTY_ARRAY,
	CORNERS,
	ICONS,
	MIN_BORDER_RADIUS_VALUE,
} from './constants';
import type { Preset } from '../preset-input-control/types';
import type {
	BorderRadiusControlProps,
	BorderRadiusCorner,
	BorderRadiusCornerValues,
	BorderRadiusPresets,
	BorderRadiusUnits,
	BorderRadiusValues,
} from './types';

function useBorderRadiusSizes( presets?: BorderRadiusPresets ) {
	const defaultSizes = presets?.default ?? EMPTY_ARRAY;
	const customSizes = presets?.custom ?? EMPTY_ARRAY;
	const themeSizes = presets?.theme ?? EMPTY_ARRAY;

	return useMemo( () => {
		const sizes: Preset[] = [
			{ name: __( 'None' ), slug: '0', size: 0 },
			...customSizes,
			...themeSizes,
			...defaultSizes,
		];

		return sizes.length > RANGE_CONTROL_MAX_SIZE
			? [
					{
						name: __( 'Default' ),
						slug: 'default',
						size: undefined,
					},
					...sizes,
				]
			: sizes;
	}, [ customSizes, themeSizes, defaultSizes ] );
}

/**
 * Gets the value for a specific corner from the values object.
 *
 * @param values Border radius values.
 * @param corner Corner name ('all', 'topLeft', etc.).
 *
 * @return The corner value.
 */
function getCornerValue(
	values: BorderRadiusValues | undefined,
	corner: BorderRadiusCorner | 'all'
): string | undefined {
	if ( corner === 'all' ) {
		return getAllValue( values );
	}

	// Handle string values (shorthand)
	if ( typeof values === 'string' ) {
		return values;
	}

	// Handle object values (longhand)
	// PresetInputControl reads a stored number such as `0` at runtime.
	return values?.[ corner ] as string | undefined;
}

/**
 * Gets the selected unit for a specific corner.
 *
 * @param selectedUnits Units object.
 * @param corner        Corner name.
 *
 * @return The selected unit.
 */
function getCornerUnit(
	selectedUnits: BorderRadiusUnits,
	corner: BorderRadiusCorner | 'all'
): string | undefined {
	if ( corner === 'all' ) {
		return selectedUnits.flat;
	}
	return selectedUnits[ corner ];
}

/**
 * Creates an onChange handler for a specific corner.
 *
 * @param corner   Corner name.
 * @param values   Current values.
 * @param onChange Original onChange callback.
 *
 * @return Corner-specific onChange handler.
 */
function createCornerChangeHandler(
	corner: BorderRadiusCorner | 'all',
	values: BorderRadiusValues | undefined,
	onChange: BorderRadiusControlProps[ 'onChange' ]
) {
	return ( newValue?: string ) => {
		if ( corner === 'all' ) {
			onChange( {
				topLeft: newValue,
				topRight: newValue,
				bottomLeft: newValue,
				bottomRight: newValue,
			} );
		} else {
			// For shorthand style & backwards compatibility, handle flat string value.
			const currentValues =
				typeof values !== 'string'
					? values || {}
					: {
							topLeft: values,
							topRight: values,
							bottomLeft: values,
							bottomRight: values,
						};

			onChange( {
				...currentValues,
				[ corner ]: newValue,
			} );
		}
	};
}

/**
 * Creates a unit change handler for a specific corner.
 *
 * @param corner           Corner name.
 * @param selectedUnits    Current selected units.
 * @param setSelectedUnits Unit setter function.
 *
 * @return Corner-specific unit change handler.
 */
function createCornerUnitChangeHandler(
	corner: BorderRadiusCorner | 'all',
	selectedUnits: BorderRadiusUnits,
	setSelectedUnits: ( units: BorderRadiusUnits ) => void
) {
	return ( newUnit?: string ) => {
		const newUnits = { ...selectedUnits };
		if ( corner === 'all' ) {
			newUnits.flat = newUnit;
			newUnits.topLeft = newUnit;
			newUnits.topRight = newUnit;
			newUnits.bottomLeft = newUnit;
			newUnits.bottomRight = newUnit;
		} else {
			newUnits[ corner ] = newUnit;
		}
		setSelectedUnits( newUnits );
	};
}

/**
 * Control to display border radius options.
 *
 * @param props          Component props.
 * @param props.onChange Callback to handle onChange.
 * @param props.values   Border radius values.
 * @param props.presets  Border radius presets.
 *
 * @return Custom border radius control.
 */
export default function BorderRadiusControl( {
	onChange,
	values,
	presets,
}: BorderRadiusControlProps ) {
	const [ isLinked, setIsLinked ] = useState(
		! hasDefinedValues( values ) || ! hasMixedValues( values )
	);
	const options = useBorderRadiusSizes( presets );
	// Tracking selected units via internal state allows filtering of CSS unit
	// only values from being saved while maintaining preexisting unit selection
	// behaviour. Filtering CSS unit only values prevents invalid style values.
	// A shorthand value has no corners, which read as undefined.
	const cornerValues = values as BorderRadiusCornerValues | undefined;
	const [ selectedUnits, setSelectedUnits ] = useState< BorderRadiusUnits >( {
		flat:
			typeof values === 'string'
				? parseQuantityAndUnitFromRawValue( values )[ 1 ]
				: undefined,
		topLeft: parseQuantityAndUnitFromRawValue( cornerValues?.topLeft )[ 1 ],
		topRight: parseQuantityAndUnitFromRawValue(
			cornerValues?.topRight
		)[ 1 ],
		bottomLeft: parseQuantityAndUnitFromRawValue(
			cornerValues?.bottomLeft
		)[ 1 ],
		bottomRight: parseQuantityAndUnitFromRawValue(
			cornerValues?.bottomRight
		)[ 1 ],
	} );

	const [ availableUnits ] = useSettings( 'spacing.units' );
	const units = useCustomUnits( {
		// The setting lists unit strings.
		availableUnits: ( availableUnits as string[] | undefined ) || [
			'px',
			'em',
			'rem',
		],
	} );

	const toggleLinked = () => setIsLinked( ! isLinked );

	return (
		<fieldset className="components-border-radius-control">
			<HStack className="components-border-radius-control__header">
				<BaseControl.VisualLabel as="legend">
					{ __( 'Radius' ) }
				</BaseControl.VisualLabel>
				<LinkedButton onClick={ toggleLinked } isLinked={ isLinked } />
			</HStack>
			{ isLinked ? (
				<PresetInputControl
					ariaLabel={ CORNERS.all }
					className="components-border-radius-control"
					icon={ ICONS.all }
					minimumCustomValue={ MIN_BORDER_RADIUS_VALUE }
					onChange={ createCornerChangeHandler(
						'all',
						values,
						onChange
					) }
					onUnitChange={ createCornerUnitChangeHandler(
						'all',
						selectedUnits,
						setSelectedUnits
					) }
					presets={ options }
					presetType="border-radius"
					selectedUnit={ getCornerUnit( selectedUnits, 'all' ) }
					showTooltip
					units={ units }
					value={ getCornerValue( values, 'all' ) }
				/>
			) : (
				<VStack>
					{ (
						[
							'topLeft',
							'topRight',
							'bottomLeft',
							'bottomRight',
						] as const
					 ).map( ( corner ) => (
						<PresetInputControl
							key={ corner }
							ariaLabel={ CORNERS[ corner ] }
							className="components-border-radius-control"
							icon={ ICONS[ corner ] }
							minimumCustomValue={ MIN_BORDER_RADIUS_VALUE }
							onChange={ createCornerChangeHandler(
								corner,
								values,
								onChange
							) }
							onUnitChange={ createCornerUnitChangeHandler(
								corner,
								selectedUnits,
								setSelectedUnits
							) }
							presets={ options }
							presetType="border-radius"
							selectedUnit={ getCornerUnit(
								selectedUnits,
								corner
							) }
							showTooltip
							units={ units }
							value={ getCornerValue( values, corner ) }
						/>
					) ) }
				</VStack>
			) }
		</fieldset>
	);
}
