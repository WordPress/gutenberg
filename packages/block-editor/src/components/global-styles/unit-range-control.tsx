import type { ComponentProps } from 'react';
import {
	RangeControl,
	__experimentalUnitControl as UnitControl,
	__experimentalParseQuantityAndUnitFromRawValue as parseQuantityAndUnitFromRawValue,
} from '@wordpress/components';
import { useState } from '@wordpress/element';
import { Fieldset, Stack } from '@wordpress/ui';

type Units = NonNullable< ComponentProps< typeof UnitControl >[ 'units' ] >;

export type UnitRangeSettings = Record<
	string,
	{ min: number; max: number; step: number }
>;

interface UnitRangeControlProps {
	/** A label for both the input and the slider. */
	label: string;
	/** The current CSS value, such as `45deg`. */
	value?: string;
	/** Called with the new CSS value, or `undefined` when cleared. */
	onChange: ( value?: string ) => void;
	/** The units offered; the first is the default. */
	units: Units;
	/** The slider range and step for each unit. */
	unitSettings: UnitRangeSettings;
}

/**
 * A unit input paired with a slider whose range follows the selected unit.
 * Typed values may fall outside the slider range.
 *
 * @param props              Component props.
 * @param props.label        A label for both the input and the slider.
 * @param props.value        The current CSS value.
 * @param props.onChange     Called with the new value, or `undefined` when cleared.
 * @param props.units        The units offered; the first is the default.
 * @param props.unitSettings The slider `min`, `max` and `step` for each unit.
 *
 * @return The unit range control.
 */
export default function UnitRangeControl( {
	label,
	value,
	onChange,
	units,
	unitSettings,
}: UnitRangeControlProps ) {
	// Keeps the unit picked while the value is empty, so the slider uses it.
	const [ pickedUnit, setPickedUnit ] = useState< string >();
	const [ quantity, parsedUnit ] = parseQuantityAndUnitFromRawValue(
		value,
		units
	);
	const selectedUnit = parsedUnit ?? pickedUnit ?? units[ 0 ]?.value ?? '';
	const range = unitSettings[ selectedUnit ];

	const handleChange = ( nextValue?: string ) => {
		const [ nextQuantity ] = parseQuantityAndUnitFromRawValue( nextValue );
		onChange( nextQuantity === undefined ? undefined : nextValue );
	};

	return (
		<Fieldset.Root>
			<Fieldset.Legend>{ label }</Fieldset.Legend>
			<Stack direction="row" align="center" gap="md">
				<UnitControl
					className="block-editor-global-styles-unit-range-control__input"
					label={ label }
					hideLabelFromVision
					value={ value ?? '' }
					units={ units }
					onChange={ handleChange }
					onUnitChange={ setPickedUnit }
				/>
				<RangeControl
					className="block-editor-global-styles-unit-range-control__slider"
					label={ label }
					hideLabelFromVision
					value={ quantity }
					min={ range?.min }
					max={ range?.max }
					step={ range?.step }
					initialPosition={ 0 }
					withInputField={ false }
					onChange={ ( next ) =>
						onChange(
							next === undefined
								? undefined
								: `${ next }${ selectedUnit }`
						)
					}
				/>
			</Stack>
		</Fieldset.Root>
	);
}
