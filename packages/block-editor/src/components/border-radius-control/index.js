/**
 * WordPress dependencies
 */
import {
	BaseControl,
	__experimentalParseQuantityAndUnitFromRawValue as parseQuantityAndUnitFromRawValue,
	__experimentalUseCustomUnits as useCustomUnits,
	__experimentalVStack as VStack,
	__experimentalHStack as HStack,
} from '@wordpress/components';
import { useState, useMemo } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
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

function useBorderRadiusSizes( presets ) {
	const defaultSizes = presets?.default ?? EMPTY_ARRAY;
	const customSizes = presets?.custom ?? EMPTY_ARRAY;
	const themeSizes = presets?.theme ?? EMPTY_ARRAY;

	return useMemo( () => {
		const sizes = [
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
 * @param {Object|string} values Border radius values.
 * @param {string}        corner Corner name ('all', 'topLeft', etc.).
 *
 * @return {string|undefined} The corner value.
 */
function getCornerValue( values, corner ) {
	if ( corner === 'all' ) {
		return getAllValue( values );
	}

	// Handle string values (shorthand)
	if ( typeof values === 'string' ) {
		return values;
	}

	// Handle object values (longhand)
	return values?.[ corner ];
}

/**
 * Gets the selected unit for a specific corner.
 *
 * @param {Object} selectedUnits Units object.
 * @param {string} corner        Corner name.
 *
 * @return {string} The selected unit.
 */
function getCornerUnit( selectedUnits, corner ) {
	if ( corner === 'all' ) {
		return selectedUnits.flat;
	}
	return selectedUnits[ corner ];
}

/**
 * Creates an onChange handler for a specific corner.
 *
 * @param {string}   corner   Corner name.
 * @param {Object}   values   Current values.
 * @param {Function} onChange Original onChange callback.
 *
 * @return {Function} Corner-specific onChange handler.
 */
function createCornerChangeHandler( corner, values, onChange ) {
	return ( newValue ) => {
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
 * @param {string}   corner           Corner name.
 * @param {Object}   selectedUnits    Current selected units.
 * @param {Function} setSelectedUnits Unit setter function.
 *
 * @return {Function} Corner-specific unit change handler.
 */
function createCornerUnitChangeHandler(
	corner,
	selectedUnits,
	setSelectedUnits
) {
	return ( newUnit ) => {
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
 * @param {Object}   props          Component props.
 * @param {Function} props.onChange Callback to handle onChange.
 * @param {Object}   props.values   Border radius values.
 * @param {Object}   props.presets  Border radius presets.
 *
 * @return {Element}              Custom border radius control.
 */
export default function BorderRadiusControl( { onChange, values, presets } ) {
	const [ isLinked, setIsLinked ] = useState(
		! hasDefinedValues( values ) || ! hasMixedValues( values )
	);
	const options = useBorderRadiusSizes( presets );
	// Tracking selected units via internal state allows filtering of CSS unit
	// only values from being saved while maintaining preexisting unit selection
	// behaviour. Filtering CSS unit only values prevents invalid style values.
	const [ selectedUnits, setSelectedUnits ] = useState( {
		flat:
			typeof values === 'string'
				? parseQuantityAndUnitFromRawValue( values )[ 1 ]
				: undefined,
		topLeft: parseQuantityAndUnitFromRawValue( values?.topLeft )[ 1 ],
		topRight: parseQuantityAndUnitFromRawValue( values?.topRight )[ 1 ],
		bottomLeft: parseQuantityAndUnitFromRawValue( values?.bottomLeft )[ 1 ],
		bottomRight: parseQuantityAndUnitFromRawValue(
			values?.bottomRight
		)[ 1 ],
	} );

	const [ availableUnits ] = useSettings( 'spacing.units' );
	const units = useCustomUnits( {
		availableUnits: availableUnits || [ 'px', 'em', 'rem' ],
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
					{ [
						'topLeft',
						'topRight',
						'bottomLeft',
						'bottomRight',
					].map( ( corner ) => (
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
