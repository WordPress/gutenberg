import clsx from 'clsx';
import { useMemo, useState } from '@wordpress/element';
import {
	BaseControl,
	__experimentalParseQuantityAndUnitFromRawValue as parseQuantityAndUnitFromRawValue,
	__experimentalUseCustomUnits as useCustomUnits,
} from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { useSettings } from '../use-settings';
import PresetInputControl from '../preset-input-control';
import { CUSTOM_VALUE_SETTINGS } from '../preset-input-control/constants';
import type {
	Preset,
	PresetInputControlProps,
} from '../preset-input-control/types';
import type { DimensionControlProps, DimensionSizes } from './types';

const EMPTY_ARRAY: Preset[] = [];

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
 * @param presets Dimension presets object containing default, theme, and custom sizes.
 * @return Array of dimension size options.
 */
function useDimensionSizes( presets?: DimensionSizes ): Preset[] {
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

		return sizes;
	}, [ customSizes, themeSizes, defaultSizes ] );
}

/**
 * DimensionControl renders a linked unit control and range control for adjusting dimensions of a block.
 *
 * @see https://github.com/WordPress/gutenberg/blob/HEAD/packages/block-editor/src/components/dimension-control/README.md
 *
 * @param {Object}                     props
 * @param {?string}                    props.label          A label for the control.
 * @param {( value: string ) => void } props.onChange       Called when the dimension value changes.
 * @param {string|number}              props.value          The current dimension value.
 * @param {?string}                    props.placeholder    Placeholder text for the custom-value input.
 * @param {?string}                    props.className      Additional CSS class on the wrapping fieldset.
 * @param {?Object}                    props.dimensionSizes Optional dimension size presets. Falls back to settings from the store.
 *
 * @return {Component} The component to be rendered.
 */
export default function DimensionControl( {
	label = __( 'Dimension' ),
	onChange,
	value,
	placeholder,
	className,
	dimensionSizes: dimensionSizesProp,
}: DimensionControlProps ) {
	const [ dimensionSizesFromSettings, availableUnits ] = useSettings(
		'dimensions.dimensionSizes',
		'spacing.units'
	);
	const dimensionSizes =
		dimensionSizesProp ??
		// The setting holds the dimension size presets.
		( dimensionSizesFromSettings as DimensionSizes | undefined );

	const units = useCustomUnits( {
		// The setting lists unit strings.
		availableUnits: ( availableUnits as string[] | undefined ) || [
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

	const handleUnitChange = ( newUnit: string ) => {
		// Attempt to smooth over differences between currentUnit and newUnit.
		// This should slightly improve the experience of switching between unit types.
		const [ currentValue, currentUnit ] =
			parseQuantityAndUnitFromRawValue( value );

		if ( [ 'em', 'rem' ].includes( newUnit ) && currentUnit === 'px' ) {
			// Convert pixel value to an approximate of the new unit, assuming a root size of 16px.
			// A parsed unit comes with its quantity.
			onChange( ( currentValue! / 16 ).toFixed( 2 ) + newUnit );
		} else if (
			// An unparsed unit matches none of the units.
			[ 'em', 'rem' ].includes( currentUnit as string ) &&
			newUnit === 'px'
		) {
			// Convert to pixel value assuming a root size of 16px.
			onChange( Math.round( currentValue! * 16 ) + newUnit );
		} else if (
			[
				'%',
				'vw',
				'svw',
				'lvw',
				'dvw',
				'vh',
				'svh',
				'lvh',
				'dvh',
				'vi',
				'svi',
				'lvi',
				'dvi',
				'vb',
				'svb',
				'lvb',
				'dvb',
				'vmin',
				'svmin',
				'lvmin',
				'dvmin',
				'vmax',
				'svmax',
				'lvmax',
				'dvmax',
			].includes( newUnit ) &&
			// An undefined quantity is not greater than 100.
			( currentValue as number ) > 100
		) {
			// When converting to `%` or viewport-relative units, cap the new value at 100.
			onChange( 100 + newUnit );
		}

		setSelectedUnit( newUnit );
	};

	return (
		<fieldset
			className={ clsx( 'block-editor-dimension-control', className ) }
		>
			<BaseControl.VisualLabel as="legend">
				{ label }
			</BaseControl.VisualLabel>
			<PresetInputControl
				ariaLabel={ label }
				className="block-editor-dimension-control"
				customValueSettings={ DIMENSION_CUSTOM_VALUE_SETTINGS }
				minimumCustomValue={ 0 }
				onChange={ onChange }
				// The unit select always passes a unit.
				onUnitChange={
					handleUnitChange as PresetInputControlProps[ 'onUnitChange' ]
				}
				placeholder={ placeholder }
				presets={ options }
				presetType="dimension"
				selectedUnit={ selectedUnit }
				showTooltip
				units={ units }
				// PresetInputControl reads a numeric value at runtime.
				value={ value as string | undefined }
			/>
		</fieldset>
	);
}
