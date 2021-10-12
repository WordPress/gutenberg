/**
 * External dependencies
 */
// eslint-disable-next-line no-restricted-imports
import type { CSSProperties, SyntheticEvent } from 'react';

/**
 * Internal dependencies
 */
import type { StateReducer } from '../input-control/reducer/state';
import type { InputChangeCallback } from '../input-control/types';

export type Value = number | string;

export type SelectSize = 'default' | 'small';

export type WPUnitControlUnit = {
	/**
	 * The value for the unit, used in a CSS value (e.g `px`).
	 */
	value: string;
	/**
	 * The label used in a dropdown selector for the unit.
	 */
	label: string;
	/**
	 * Default value for the unit, used when switching units.
	 */
	default?: Value;
	/**
	 * An accessible label used by screen readers.
	 */
	a11yLabel?: string;
	/**
	 * A step value used when incrementing/decrementing the value.
	 */
	step?: number;
};

export type WPUnitControlUnitList = Array< WPUnitControlUnit > | false;

export type UnitControlOnChangeCallback = InputChangeCallback<
	SyntheticEvent< HTMLSelectElement | HTMLInputElement >,
	{ data?: WPUnitControlUnit }
>;

export type UnitSelectControlProps = {
	isUnitSelectTabbable: boolean;
	onChange?: UnitControlOnChangeCallback;
	size?: SelectSize;
	unit?: string;
	units?: WPUnitControlUnitList;
};

export type UnitControlProps = UnitSelectControlProps & {
	__unstableStateReducer?: StateReducer;
	autoComplete?: string;
	disableUnits?: boolean;
	isPressEnterToChange?: boolean;
	isResetValueOnUnitChange?: boolean;
	label?: string;
	onUnitChange?: UnitControlOnChangeCallback;
	step?: number;
	style?: CSSProperties;
	value: string;
};
