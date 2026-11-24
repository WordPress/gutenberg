import type { ComponentProps } from 'react';
import {
	RangeControl,
	__experimentalUnitControl as UnitControl,
	__experimentalParseQuantityAndUnitFromRawValue as parseQuantityAndUnitFromRawValue,
} from '@wordpress/components';
import { useState } from '@wordpress/element';
import { Fieldset, Stack } from '@wordpress/ui';

type UnitControlProps = ComponentProps< typeof UnitControl >;
type Units = NonNullable< UnitControlProps[ 'units' ] >;
type StateReducer = NonNullable< UnitControlProps[ '__unstableStateReducer' ] >;

export type UnitRangeSettings = Record<
	string,
	{ min: number; max: number; step: number }
>;

interface UnitRangeControlProps {
	/** A label for both the input and the slider. */
	label: string;
	/** An accessible label for the input and the slider, when it differs from `label`. */
	controlLabel?: string;
	/** The current CSS value, such as `45deg`. */
	value?: string;
	/** Called with the new CSS value, or `undefined` when cleared. */
	onChange: ( value?: string ) => void;
	/** A value to show, but not save, while `value` is empty, such as an inherited one. */
	placeholder?: string;
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
 * @param props.controlLabel An accessible label for the input and the slider, when it differs from `label`.
 * @param props.value        The current CSS value.
 * @param props.onChange     Called with the new value, or `undefined` when cleared.
 * @param props.placeholder  A value to show, but not save, while `value` is empty.
 * @param props.units        The units offered; the first is the default.
 * @param props.unitSettings The slider `min`, `max` and `step` for each unit.
 *
 * @return The unit range control.
 */
export default function UnitRangeControl( {
	label,
	controlLabel = label,
	value,
	onChange,
	placeholder,
	units,
	unitSettings,
}: UnitRangeControlProps ) {
	// Keeps the unit picked while the value is empty, so the slider uses it.
	const [ pickedUnit, setPickedUnit ] = useState< string >();
	const [ quantity, parsedUnit ] = parseQuantityAndUnitFromRawValue(
		value,
		units
	);
	const [ placeholderQuantity, placeholderUnit ] =
		parseQuantityAndUnitFromRawValue( placeholder, units );
	const selectedUnit =
		parsedUnit ?? pickedUnit ?? placeholderUnit ?? units[ 0 ]?.value ?? '';
	const range = unitSettings[ selectedUnit ];

	// An arrow key in an empty field spins from 0, so the spun value is the step.
	// Add it to the placeholder instead, so the value doesn't jump.
	const stepFromPlaceholder: StateReducer = ( state, action ) => {
		if (
			quantity !== undefined ||
			placeholderQuantity === undefined ||
			selectedUnit !== placeholderUnit ||
			( action.type !== 'PRESS_UP' && action.type !== 'PRESS_DOWN' )
		) {
			return state;
		}
		const next = placeholderQuantity + Number( state.value );
		return { ...state, value: `${ parseFloat( next.toPrecision( 12 ) ) }` };
	};

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
					label={ controlLabel }
					hideLabelFromVision
					// A bare unit keeps the select on `selectedUnit` while the field is empty.
					value={ value || selectedUnit }
					placeholder={ placeholderQuantity?.toString() }
					units={ units }
					onChange={ handleChange }
					onUnitChange={ setPickedUnit }
					__unstableStateReducer={ stepFromPlaceholder }
				/>
				<RangeControl
					className="block-editor-global-styles-unit-range-control__slider"
					label={ controlLabel }
					hideLabelFromVision
					value={ quantity }
					min={ range?.min }
					max={ range?.max }
					step={ range?.step }
					initialPosition={ placeholderQuantity ?? 0 }
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
