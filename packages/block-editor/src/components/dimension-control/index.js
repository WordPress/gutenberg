/**
 * WordPress dependencies
 */
import { useMemo, useState } from '@wordpress/element';
import {
	BaseControl,
	__experimentalParseQuantityAndUnitFromRawValue as parseQuantityAndUnitFromRawValue,
	__experimentalUseCustomUnits as useCustomUnits,
} from '@wordpress/components';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { useSettings } from '../use-settings';
import PresetInputControl from '../preset-input-control';
import { CUSTOM_VALUE_SETTINGS } from '../preset-input-control/constants';

const EMPTY_ARRAY = [];

// Dimension-specific custom value settings - override defaults for larger dimension values
const DIMENSION_CUSTOM_VALUE_SETTINGS = {
	...CUSTOM_VALUE_SETTINGS,
	px: { max: 1000, steps: 1 },
	em: { max: 50, steps: 0.1 },
	rem: { max: 50, steps: 0.1 },
};

/**
 * Hook to retrieve dimension sizes from theme settings.
 *
 * @param {Object} presets Dimension presets object containing default, theme, and custom sizes.
 * @return {Array} Array of dimension size options.
 */
function useDimensionSizes( presets ) {
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

		return sizes;
	}, [ customSizes, themeSizes, defaultSizes ] );
}

/**
 * DimensionControl renders a linked unit control and range control for adjusting dimensions of a block.
 *
 * @see https://github.com/WordPress/gutenberg/blob/HEAD/packages/block-editor/src/components/dimension-control/README.md
 *
 * @param {Object}                     props
 * @param {?string}                    props.label    A label for the control.
 * @param {( value: string ) => void } props.onChange Called when the dimension value changes.
 * @param {string}                     props.value    The current dimension value.
 *
 * @return {Component} The component to be rendered.
 */
export default function DimensionControl( {
	label = __( 'Dimension' ),
	onChange,
	value,
} ) {
	const [ dimensionSizes, availableUnits ] = useSettings(
		'dimensions.dimensionSizes',
		'spacing.units'
	);

	const units = useCustomUnits( {
		availableUnits: availableUnits || [
			'%',
			'px',
			'em',
			'rem',
			'vh',
			'vw',
		],
	} );

	const options = useDimensionSizes( dimensionSizes );

	// Track selected unit for PresetInputControl
	const [ selectedUnit, setSelectedUnit ] = useState( () => {
		const [ , unit ] = parseQuantityAndUnitFromRawValue( value );
		return unit || units[ 0 ]?.value || 'px';
	} );

	return (
		<fieldset className="block-editor-dimension-control">
			<BaseControl.VisualLabel as="legend">
				{ label }
			</BaseControl.VisualLabel>
			<PresetInputControl
				ariaLabel={ label }
				className="block-editor-dimension-control"
				customValueSettings={ DIMENSION_CUSTOM_VALUE_SETTINGS }
				minimumCustomValue={ 0 }
				onChange={ onChange }
				onUnitChange={ setSelectedUnit }
				presets={ options }
				presetType="dimension"
				selectedUnit={ selectedUnit }
				showTooltip
				smoothUnitConversions
				units={ units }
				value={ value }
			/>
		</fieldset>
	);
}
